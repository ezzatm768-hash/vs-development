import { NextResponse } from "next/server";
import { getDB, persist } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  const { id }=await params;
  const body=await req.json();
  const db=await getDB();
  const sale=db.sales.find((s:any)=>s.id===id);
  if(!sale) return NextResponse.json({error:"غير موجود"},{status:404});
  if(user.role==="team_leader"){
    const team=db.teams.find((t:any)=>t.team_leader_id===user.id);
    if(!team || sale.team_id!==team.id) return NextResponse.json({error:"ليس ضمن فريقك"},{status:403});
  }
  if(body.name!==undefined) sale.name=body.name;
  if(body.phone!==undefined) sale.phone=body.phone;
  if(body.join_date!==undefined) sale.join_date=body.join_date;
  persist(db);
  return NextResponse.json({message:"تم التحديث"});
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  const { id }=await params;
  const db=await getDB();
  const idx=db.sales.findIndex((s:any)=>s.id===id);
  if(idx===-1) return NextResponse.json({error:"غير موجود"},{status:404});
  const sale=db.sales[idx];
  if(user.role==="team_leader"){
    const team=db.teams.find((t:any)=>t.team_leader_id===user.id);
    if(!team || sale.team_id!==team.id) return NextResponse.json({error:"ليس ضمن فريقك"},{status:403});
  }
  db.evaluations=db.evaluations.filter((e:any)=>e.sales_id!==id);
  db.sales.splice(idx,1);
  persist(db);
  return NextResponse.json({message:"تم الحذف"});
}
