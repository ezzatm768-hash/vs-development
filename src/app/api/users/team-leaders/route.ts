import { NextResponse } from "next/server";
import { getDB, persist, uid } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }

async function getConvex(){
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
  if(user.role!=="admin") return NextResponse.json({error:"Admin فقط"},{status:403});
  const convex = await getConvex();
  if(convex){
    try{
      const callerId = await getConvexCallerId(convex, user);
      if(callerId){
        const data:any = await convex.query("users:listTeamLeaders" as any, { callerId });
        const mapped = data.map((u:any)=>({ id: u._id||u.id, username: u.username, name: u.name, created_at: u.created_at, team_name: u.team_name, team_id: u.team_id, member_count: u.member_count }));
        return NextResponse.json(mapped);
      }
    }catch(e:any){ /* fallback to file */ }
  }
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
  const convex = await getConvex();
  if(convex){
    try{
      const callerId = await getConvexCallerId(convex, user);
      if(callerId){
        const hashed=await bcrypt.hash(password,10);
        const res:any = await convex.mutation("users:createTeamLeader" as any, { callerId, username, password: hashed, name });
        return NextResponse.json({ id: res.userId || res.id, message:"تم الإنشاء" });
      }
    }catch(e:any){
      const msg = e?.message || "فشل";
      if(msg.includes("موجود")) return NextResponse.json({error:"اسم المستخدم موجود"},{status:400});
      // fallback
    }
  }
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
