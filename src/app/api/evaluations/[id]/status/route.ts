import { NextResponse } from "next/server";
import { getDB, persist, uid } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }
async function getConvex(){
  const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "";
  if(!CONVEX_URL || CONVEX_URL.includes("127.0.0.1")) return null; try{ const { ConvexHttpClient } = await import("convex/browser"); return new ConvexHttpClient(CONVEX_URL); }catch{ return null; } }
function isConvexId(id:string){ return id && !id.startsWith("u") && id.length>10; }
async function getConvexCallerId(convex: any, user: any){ if(isConvexId(user.id)) return user.id; try{ const u = await convex.query("auth:getUserByUsername" as any, { username: user.username }); if(u?._id) return u._id; }catch{} return null; }

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="admin") return NextResponse.json({error:"للأدمن فقط"},{status:403});
  const { id }=await params;
  const { status, admin_notes }=await req.json();
  const convex = await getConvex();
  if(convex){
    try{
      const callerId = await getConvexCallerId(convex, user);
      if(callerId){ await convex.mutation("evaluations:updateStatus" as any, { callerId, id, status, admin_notes }); return NextResponse.json({message:"تم التحديث"}); }
    }catch(e: any){ return NextResponse.json({error:String(e?.message||"فشل")},{status:400}); }
  }
  const db=await getDB();
  const ev=db.evaluations.find((e:any)=>e.id===id);
  if(!ev) return NextResponse.json({error:"غير موجود"},{status:404});
  ev.status=status;
  ev.admin_notes=admin_notes;
  ev.updated_at=Date.now();
  if(status==="reviewed") ev.reviewed_at=Date.now();
  if(status==="returned"){
    db.notifications.push({ id: uid("n"), user_id: ev.team_leader_id, message: "تمت إعادة التقييم للمراجعة. يرجى التعديل وإعادة الإرسال.", type:"warning", read:0, created_at: Date.now() });
  }
  persist(db);
  return NextResponse.json({message:"تم التحديث"});
}
