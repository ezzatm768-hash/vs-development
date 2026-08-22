import { NextResponse } from "next/server";
import { getDB } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }
async function getConvex(){ if(!CONVEX_URL || CONVEX_URL.includes("127.0.0.1")) return null; try{ const { ConvexHttpClient } = await import("convex/browser"); return new ConvexHttpClient(CONVEX_URL); }catch{ return null; } }
function isConvexId(id:string){ return id && !id.startsWith("u") && id.length>10; }

export async function GET(req: Request){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="admin") return NextResponse.json({error:"Admin فقط"},{status:403});
  const convex = await getConvex();
  if(convex && isConvexId(user.id)){
    try{ const data:any = await convex.query("teams:list" as any, { callerId: user.id }); return NextResponse.json(data); }catch{}
  }
  const db=await getDB();
  const enriched=db.teams.map((t:any)=>{
    const leader=db.users.find((u:any)=>u.id===t.team_leader_id);
    const count=db.sales.filter((s:any)=>s.team_id===t.id).length;
    return {...t, leader_name: leader?.name || "", member_count: count};
  });
  return NextResponse.json(enriched);
}
