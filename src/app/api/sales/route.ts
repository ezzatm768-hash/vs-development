import { NextResponse } from "next/server";
import { getDB, persist, uid } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }
async function getConvex(){
  let CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || ""; CONVEX_URL = CONVEX_URL.replace(/\/$/, "");
  if(!CONVEX_URL || CONVEX_URL.includes("127.0.0.1")) return null;
  try{ const { ConvexHttpClient } = await import("convex/browser"); return new ConvexHttpClient(CONVEX_URL); }catch{ return null; }
}
function isConvexId(id:string){ return id && !id.startsWith("u") && id.length>10; }
async function getConvexCallerId(convex:any, user:any){
  if(isConvexId(user.id)) return user.id;
  try{ const u:any = await convex.query("auth:getUserByUsername" as any, { username: user.username }); if(u?._id) return u._id; }catch{}
  return null;
}

export async function GET(req: Request){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  const convex = await getConvex();
  if(convex){
    try{
      const callerId = await getConvexCallerId(convex, user);
      if(callerId){ const data:any = await convex.query("sales:list" as any, { callerId }); return NextResponse.json(data); }
    }catch(e: any){ /* fallback */ }
  }
  const db=await getDB();
  let sales=db.sales;
  if(user.role==="team_leader"){
    const uidFix = user.id === "2" ? "u2" : user.id === "1" ? "u1" : user.id;
    const team=db.teams.find((t:any)=>t.team_leader_id===user.id || t.team_leader_id===uidFix);
    if(!team) return NextResponse.json([]);
    sales=sales.filter((s:any)=>s.team_id===team.id);
  }
  const enriched=sales.map((s:any)=>{
    const team=db.teams.find((t:any)=>t.id===s.team_id);
    const leader=team? db.users.find((u:any)=>u.id===team.team_leader_id):null;
    return {...s, team_name: team?.team_name || "", team_leader_name: leader?.name || ""};
  }).sort((a:any,b:any)=>a.name.localeCompare(b.name,"ar"));
  return NextResponse.json(enriched);
}

export async function POST(req: Request){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="team_leader" && user.role!=="admin") return NextResponse.json({error:"غير مصرح"},{status:403});
  const { name, phone, join_date, team_id }=await req.json();
  if(!name || name.trim().length < 2) return NextResponse.json({error:"الاسم يجب أن يكون حرفين على الأقل"},{status:400});
  const convex = await getConvex();
  if(convex){
    try{
      const callerId = await getConvexCallerId(convex, user);
      if(callerId){ const id:any = await convex.mutation("sales:create" as any, { callerId, name: name.trim(), phone: phone||"", join_date: join_date||"" }); return NextResponse.json({ id, message:"تمت الإضافة" }); }
    }catch(e:any){ const m=String(e?.message||""); if(m.includes("موجود")) return NextResponse.json({error:m},{status:400}); }
  }
  const db=await getDB();
  let teamId=team_id || user.team_id;
  if(!teamId){
    const uidFix = user.id === "2" ? "u2" : user.id;
    const t=db.teams.find((x:any)=>x.team_leader_id===user.id || x.team_leader_id===uidFix);
    if(!t) return NextResponse.json({error:"لا يوجد فريق"},{status:400});
    teamId=t.id;
  }
  const duplicate = db.sales.find((s:any)=> s.team_id===teamId && s.name.trim().toLowerCase() === name.trim().toLowerCase());
  if(duplicate) return NextResponse.json({error:"هذا الاسم موجود بالفعل في فريقك"},{status:400});
  const id=uid("s");
  const sale={ id, name, team_id: teamId, phone: phone||"", join_date: join_date|| new Date().toISOString().split("T")[0], status:"active", created_at: Date.now() };
  db.sales.push(sale);
  const active=db.evaluation_periods.find((p:any)=>p.status==="active");
  if(active){
    const leaderId = user.id === "2" ? "u2" : user.id;
    db.evaluations.push({ id: uid("ev"), sales_id:id, team_leader_id:leaderId, evaluation_period: active.name, evaluation_period_id: active.id, status:"draft", created_at: Date.now(), updated_at: Date.now() });
  }
  persist(db);
  return NextResponse.json({ id, message:"تمت الإضافة" });
}
