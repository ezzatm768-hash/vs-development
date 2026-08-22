import { NextResponse } from "next/server";
import { getDB, persist, uid } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }
async function getConvex(){ if(!CONVEX_URL || CONVEX_URL.includes("127.0.0.1")) return null; try{ const { ConvexHttpClient } = await import("convex/browser"); return new ConvexHttpClient(CONVEX_URL); }catch{ return null; } }
function isConvexId(id:string){ return id && !id.startsWith("u") && id.length>10; }
async function getConvexCallerId(convex: any, user: any){ if(isConvexId(user.id)) return user.id; try{ const u = await convex.query("auth:getUserByUsername" as any, { username: user.username }); if(u?._id) return u._id; }catch{} return null; }

export async function GET(req: Request){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  const convex = await getConvex();
  if(convex){
    try{ const callerId = await getConvexCallerId(convex, user); if(callerId){ const data = await convex.query("periods:list" as any, { callerId }); return NextResponse.json(data); } }catch{}
  }
  const db=await getDB();
  return NextResponse.json(db.evaluation_periods.sort((a:any,b:any)=> (b.created_at||0)-(a.created_at||0)));
}

export async function POST(req: Request){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="admin") return NextResponse.json({error:"للأدمن فقط"},{status:403});
  const { name, start_date, end_date, period_type }=await req.json();
  if(!name) return NextResponse.json({error:"الاسم مطلوب"},{status:400});
  const convex = await getConvex();
  if(convex){
    try{ const callerId = await getConvexCallerId(convex, user); if(callerId){ const id = await convex.mutation("periods:create" as any, { callerId, name, start_date, end_date, period_type }); return NextResponse.json({ id, message:"تم الإنشاء" }); } }catch(e: any){ return NextResponse.json({error:String(e?.message||"فشل")},{status:400}); }
  }
  const db=await getDB();
  const id=uid("p");
  const period={ id, name, start_date, end_date, period_type: period_type||"monthly", status:"active", created_at: Date.now() };
  db.evaluation_periods.push(period);
  for(const sale of db.sales){
    const team=db.teams.find((t:any)=>t.id===sale.team_id);
    if(team?.team_leader_id){
      const exists=db.evaluations.find((e:any)=>e.sales_id===sale.id && e.evaluation_period_id===id);
      if(!exists) db.evaluations.push({ id: uid("ev"), sales_id: sale.id, team_leader_id: team.team_leader_id, evaluation_period: name, evaluation_period_id: id, status:"draft", created_at: Date.now(), updated_at: Date.now() });
    }
  }
  const leaders=db.users.filter((u:any)=>u.role==="team_leader");
  for(const l of leaders) db.notifications.push({ id: uid("n"), user_id: l.id, message:`فترة تقييم جديدة بدأت: ${name}`, type:"info", read:0, created_at: Date.now() });
  persist(db);
  return NextResponse.json({ id, message:"تم الإنشاء" });
}
