import { NextResponse } from "next/server";
import { getDB, persist, uid } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }

export async function GET(req: Request){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="admin") return NextResponse.json({error:"Admin فقط"},{status:403});
  const db=await getDB();
  const leaders=db.users.filter((u:any)=>u.role==="team_leader").map((u:any)=>{
    const team=db.teams.find((t:any)=>t.team_leader_id===u.id);
    const count=team? db.sales.filter((s:any)=>s.team_id===team.id).length:0;
    return { id:u.id, username:u.username, name:u.name, created_at:u.created_at, team_name: team?.team_name || null, team_id: team?.id || null, member_count: count };
  });
  return NextResponse.json(leaders);
}

export async function POST(req: Request){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="admin") return NextResponse.json({error:"Admin فقط"},{status:403});
  const { username, password, name }=await req.json();
  if(!username||!password||!name) return NextResponse.json({error:"جميع الحقول مطلوبة"},{status:400});
  const db=await getDB();
  if(db.users.find((u:any)=>u.username===username)) return NextResponse.json({error:"اسم المستخدم موجود"},{status:400});
  const hashed=await bcrypt.hash(password,10);
  const id=uid("u");
  const teamId=uid("t");
  db.users.push({ id, username, password: hashed, role:"team_leader", name, team_id: teamId, created_at: Date.now() });
  db.teams.push({ id: teamId, team_name:`فريق ${name}`, team_leader_id: id, created_at: Date.now() });
  persist(db);
  return NextResponse.json({ id, message:"تم الإنشاء" });
}
