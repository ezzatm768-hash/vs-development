import { NextResponse } from "next/server";
import { getDB, persist } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="admin") return NextResponse.json({error:"Admin فقط"},{status:403});
  const { id }=await params;
  const db=await getDB();
  const idx=db.users.findIndex((u:any)=>u.id===id);
  if(idx===-1) return NextResponse.json({error:"غير موجود"},{status:404});
  const u=db.users[idx];
  const team=db.teams.find((t:any)=>t.team_leader_id===id);
  if(team){
    db.evaluations=db.evaluations.filter((e:any)=> e.sales_id && !db.sales.find((s:any)=>s.id===e.sales_id && s.team_id===team.id));
    db.sales=db.sales.filter((s:any)=>s.team_id!==team.id);
    db.teams=db.teams.filter((t:any)=>t.id!==team.id);
  }
  db.users.splice(idx,1);
  persist(db);
  return NextResponse.json({message:"تم الحذف"});
}
