import { NextResponse } from "next/server";
import { getDB, persist } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="admin") return NextResponse.json({error:"Admin فقط"},{status:403});
  const { id }=await params;
  const { name, username, password }=await req.json();
  if(!name && !username && !password) return NextResponse.json({error:"لا يوجد ما يتم تعديله"},{status:400});
  const convex = await getConvex();
  if(convex){
    try{
      const callerId = await getConvexCallerId(convex, user);
      if(callerId){
        const payload:any={ callerId, id };
        if(name) payload.name = name;
        if(username) payload.username = username;
        if(password) payload.password = await bcrypt.hash(password,10);
        await convex.mutation("users:updateTeamLeader" as any, payload);
        return NextResponse.json({message:"تم التعديل"});
      }
    }catch(e:any){
      const msg = String(e?.message||"");
      if(msg.includes("البريد")) return NextResponse.json({error: msg},{status:400});
      // fallback to file DB
    }
  }
  const db=await getDB();
  const idx=db.users.findIndex((u:any)=>u.id===id);
  if(idx===-1) return NextResponse.json({error:"غير موجود"},{status:404});
  const target=db.users[idx];
  if(username && username!==target.username){
    if(db.users.find((u:any)=>u.username===username && u.id!==id)) return NextResponse.json({error:"البريد/اسم المستخدم موجود مسبقاً"},{status:400});
    target.username=username;
  }
  if(name) target.name=name;
  if(password){
    if(password.length<3) return NextResponse.json({error:"كلمة المرور قصيرة جداً"},{status:400});
    target.password=await bcrypt.hash(password,10);
  }
  // also update team name if leader name changed
  if(name){
    const team=db.teams.find((t:any)=>t.team_leader_id===id);
    if(team && team.team_name.startsWith("فريق ")) team.team_name=`فريق ${name}`;
  }
  persist(db);
  return NextResponse.json({message:"تم التعديل", user: { id: target.id, username: target.username, name: target.name }});
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="admin") return NextResponse.json({error:"Admin فقط"},{status:403});
  const { id }=await params;
  const convex = await getConvex();
  if(convex){
    try{
      const callerId = await getConvexCallerId(convex, user);
      if(callerId){
        const res:any = await convex.mutation("users:deleteTeamLeader" as any, { callerId, id });
        return NextResponse.json({message:"تم الحذف"});
      }
    }catch(e:any){}
  }
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
