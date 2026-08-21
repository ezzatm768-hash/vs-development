import { NextResponse } from "next/server";
import { getDB } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  const { id }=await params;
  const db=await getDB();
  const ev=db.evaluations.find((e:any)=>e.id===id);
  if(!ev) return NextResponse.json({error:"غير موجود"},{status:404});
  if(user.role==="team_leader" && ev.team_leader_id!==user.id) return NextResponse.json({error:"غير مصرح لك بالوصول لهذا التقييم"},{status:403});
  const sales=db.sales.find((s:any)=>s.id===ev.sales_id);
  const leader=db.users.find((u:any)=>u.id===ev.team_leader_id);
  const period=ev.evaluation_period_id ? db.evaluation_periods.find((p:any)=>p.id===ev.evaluation_period_id) : null;
  return NextResponse.json({ ...ev, sales_name: sales?.name, sales_phone: sales?.phone, team_leader_name: leader?.name, period_name: period?.name || ev.evaluation_period, period, sales });
}
