import { NextResponse } from "next/server";
import { getDB } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }

export async function GET(req: Request){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  const db=await getDB();
  // توافق للتوكنات القديمة: 2 -> u2
  const uid = user.id === "2" ? "u2" : user.id === "1" ? "u1" : user.id;
  const team=db.teams.find((t:any)=>t.team_leader_id===user.id || t.team_leader_id===uid);
  if(!team) return NextResponse.json({ team:null, members:[], stats:{}, recentReports:[], reports:[], activePeriod:null });
  const members=db.sales.filter((s:any)=>s.team_id===team.id);
  const activePeriod=db.evaluation_periods.find((p:any)=>p.status==="active") || null;
  let stats={ totalMembers: members.length, requiredReports:0, completedReports:0, pendingReports:0, submittedReports:0 };
  let reports=db.evaluations.filter((e:any)=>e.team_leader_id===user.id || e.team_leader_id===uid).map((e:any)=>{
    const s=db.sales.find((x:any)=>x.id===e.sales_id);
    return {...e, sales_name: s?.name || "", period_name: e.evaluation_period};
  });
  if(activePeriod){
    stats.requiredReports=members.length;
    const mine=db.evaluations.filter((e:any)=>(e.team_leader_id===user.id || e.team_leader_id===uid) && e.evaluation_period_id===activePeriod.id);
    stats.completedReports=mine.filter((e:any)=>e.status==="reviewed").length;
    stats.submittedReports=mine.filter((e:any)=>e.status==="submitted").length;
    stats.pendingReports=stats.requiredReports - stats.completedReports - stats.submittedReports;
    if(stats.pendingReports<0) stats.pendingReports=0;
  }
  return NextResponse.json({ team, members, stats, recentReports: reports.slice(0,5), reports, activePeriod });
}
