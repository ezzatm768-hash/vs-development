import { NextResponse } from "next/server";
import { getDB } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }

export async function GET(req: Request){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="admin") return NextResponse.json({error:"Admin فقط"},{status:403});
  const db=await getDB();
  const enriched=db.teams.map((t:any)=>{
    const leader=db.users.find((u:any)=>u.id===t.team_leader_id);
    const count=db.sales.filter((s:any)=>s.team_id===t.id).length;
    return {...t, leader_name: leader?.name || "", member_count: count};
  });
  return NextResponse.json(enriched);
}
