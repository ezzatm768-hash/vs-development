import { NextResponse } from "next/server";
import { getDB, persist, uid } from "@/lib/serverDb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
function auth(req: Request) {
  const h = req.headers.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}
async function getConvex(){
  const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "";
  if(!CONVEX_URL || CONVEX_URL.includes("127.0.0.1")) return null;
  try{ const { ConvexHttpClient } = await import("convex/browser"); return new ConvexHttpClient(CONVEX_URL); }catch{ return null; }
}
function isConvexId(id:string){ return id && !id.startsWith("u") && id.length>10; }
async function getConvexCallerId(convex: any, user: any){ if(isConvexId(user.id)) return user.id; try{ const u = await convex.query("auth:getUserByUsername" as any, { username: user.username }); if(u?._id) return u._id; }catch{} return null; }

export async function GET(req: Request) {
  const user: any = auth(req);
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const convex = await getConvex();
  if(convex){
    try{
      const callerId = await getConvexCallerId(convex, user);
      if(callerId){
        const url = new URL(req.url);
        const search = url.searchParams.get("search") || undefined;
        const status = url.searchParams.get("status") || undefined;
        const data = await convex.query("evaluations:list" as any, { callerId, search, status });
        return NextResponse.json(data);
      }
    }catch{}
  }
  const db = await getDB();
  let list = db.evaluations;
  const uidFix = user.id === "2" ? "u2" : user.id === "1" ? "u1" : user.id;
  if (user.role === "team_leader") list = list.filter((e: any) => e.team_leader_id === user.id || e.team_leader_id === uidFix);
  const enriched = list.map((e: any) => {
    const sales = db.sales.find((s: any) => s.id === e.sales_id);
    const leader = db.users.find((u: any) => u.id === e.team_leader_id);
    return { ...e, sales_name: sales?.name || e.sales_id, team_leader_name: leader?.name || "", period_name: e.evaluation_period };
  }).sort((a: any, b: any) => b.updated_at - a.updated_at);

  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");
  let out = enriched;
  if (status) out = out.filter((x: any) => x.status === status);
  if (search) out = out.filter((x: any) => (x.sales_name || "").includes(search) || (x.evaluation_period || "").includes(search));
  return NextResponse.json(out);
}

export async function POST(req: Request) {
  const user: any = auth(req);
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const body = await req.json();
  const { sales_id, evaluation_period, evaluation_period_id, product_knowledge, communication, needs_discovery, sales_process, crm_discipline, follow_up_activity, strengths, weaknesses, main_problem, employee_status, final_notes, status, existingId } = body;
  if (!sales_id) return NextResponse.json({ error: "sales_id مطلوب" }, { status: 400 });

  const convex = await getConvex();
  if(convex){
    try{
      const callerId = await getConvexCallerId(convex, user);
      if(callerId){
        const id = await convex.mutation("evaluations:createOrUpdate" as any, {
          callerId, sales_id, evaluation_period, evaluation_period_id,
          product_knowledge, communication, needs_discovery, sales_process, crm_discipline, follow_up_activity,
          strengths, weaknesses, main_problem, employee_status, final_notes, status: status||"draft", existingId: existingId||undefined
        });
        return NextResponse.json({ id, message:"تم الحفظ" });
      }
    }catch(e: any){ return NextResponse.json({error:String(e?.message||"فشل")},{status:400}); }
  }

  const db = await getDB();
  const sales = db.sales.find((s: any) => s.id === sales_id);
  if (!sales) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
  const uidFix2 = user.id === "2" ? "u2" : user.id;
  if (user.role === "team_leader") {
    const team = db.teams.find((t: any) => t.id === sales.team_id);
    if (!team || (team.team_leader_id !== user.id && team.team_leader_id !== uidFix2)) return NextResponse.json({ error: "هذا الموظف ليس ضمن فريقك" }, { status: 403 });
  }
  const now = Date.now();
  let target: any = null;
  if (existingId) target = db.evaluations.find((e: any) => e.id === existingId);
  else if (evaluation_period_id) target = db.evaluations.find((e: any) => e.sales_id === sales_id && e.evaluation_period_id === evaluation_period_id);
  if (target) {
    if (user.role === "team_leader" && target.team_leader_id !== user.id && target.team_leader_id !== uidFix2) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    Object.assign(target, {
      evaluation_period, evaluation_period_id, product_knowledge, communication, needs_discovery, sales_process, crm_discipline, follow_up_activity, strengths, weaknesses, main_problem, employee_status, final_notes, status: status || target.status, updated_at: now, submitted_at: status === "submitted" ? now : target.submitted_at
    });
    persist(db);
    if (status === "submitted") {
      const admins = db.users.filter((u: any) => u.role === "admin");
      for (const a of admins) db.notifications.push({ id: uid("n"), user_id: a.id, message: `تقرير جديد من ${user.name}`, type: "info", read: 0, created_at: now });
      persist(db);
    }
    return NextResponse.json({ id: target.id, message: "تم التحديث" });
  }
  const id = uid("ev");
  const ev = {
    id,
    sales_id,
    team_leader_id: user.id,
    evaluation_period,
    evaluation_period_id,
    product_knowledge, communication, needs_discovery, sales_process, crm_discipline, follow_up_activity,
    strengths, weaknesses, main_problem, employee_status, final_notes,
    status: status || "draft",
    created_at: now,
    updated_at: now,
    submitted_at: status === "submitted" ? now : undefined,
  };
  db.evaluations.push(ev);
  if (status === "submitted") {
    const admins = db.users.filter((u: any) => u.role === "admin");
    for (const a of admins) db.notifications.push({ id: uid("n"), user_id: a.id, message: `تقرير جديد من ${user.name}`, type: "info", read: 0, created_at: now });
  }
  persist(db);
  return NextResponse.json({ id, message: "تم الحفظ" });
}
