import { NextResponse } from "next/server";
import { getDB } from "@/lib/serverDb";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
function auth(req: Request){ const h=req.headers.get("authorization")||""; const t=h.startsWith("Bearer ")?h.slice(7):""; if(!t) return null; try{return jwt.verify(t,JWT_SECRET) as any}catch{return null} }
async function getConvex(){
  let CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || ""; CONVEX_URL = CONVEX_URL.replace(/\/$/, "");
  if(!CONVEX_URL || CONVEX_URL.includes("127.0.0.1")) return null; try{ const { ConvexHttpClient } = await import("convex/browser"); return new ConvexHttpClient(CONVEX_URL); }catch{ return null; } }
function isConvexId(id:string){ return id && !id.startsWith("u") && id.length>10; }
async function getConvexCallerId(convex: any, user: any){ if(isConvexId(user.id)) return user.id; try{ const u = await convex.query("auth:getUserByUsername" as any, { username: user.username }); if(u?._id) return u._id; }catch{} return null; }

export async function GET(req: Request){
  const user:any=auth(req); if(!user) return NextResponse.json({error:"غير مصرح"},{status:401});
  if(user.role!=="admin") return NextResponse.json({error:"Admin فقط"},{status:403});
  const convex = await getConvex();
  if(convex){
    try{
      const callerId = await getConvexCallerId(convex, user);
      if(!callerId) throw new Error("no caller");
      const stats = await convex.query("users:dashboardStats" as any, { callerId });
      const sales = await convex.query("sales:list" as any, { callerId });
      const evals = await convex.query("evaluations:list" as any, { callerId });
      // Build salesTable similar to file logic but using convex data
      const salesTable = sales.map((s:any)=>{
        const evalsForSales = evals.filter((e:any)=> (e.sales_id===s._id || e.sales_id===s.id)).sort((a:any,b:any)=> (b.updated_at||0)-(a.updated_at||0));
        const latest = evalsForSales[0]||null;
        let statusLabel="لم يتم التقييم"; let statusColor="slate";
        if(latest){
          if(latest.employee_status){ statusLabel=latest.employee_status; if(["يحتاج متابعة","يحتاج تدريب"].includes(latest.employee_status)) statusColor="amber"; else if(latest.employee_status==="مشكلة") statusColor="red"; else if(["جيد","ممتاز"].includes(latest.employee_status)) statusColor="emerald"; else statusColor="sky"; }
          else if(latest.status==="draft" && (!latest.product_knowledge && !latest.strengths)){ statusLabel="لم يتم التقييم"; statusColor="slate"; }
          else { statusLabel=latest.status==="draft"?"مسودة": latest.status==="submitted"?"مرسل":"مكتمل"; statusColor=latest.status==="draft"?"slate": latest.status==="submitted"?"amber":"emerald"; }
        }
        return { id: s._id||s.id, name: s.name, phone: s.phone, team_name: s.team_name||"", team_leader_name: s.team_leader_name||"", statusLabel, statusColor, latestId: latest?._id||latest?.id||null, lastEval: latest?.submitted_at? new Date(latest.submitted_at).toLocaleDateString("en-GB"):"—", lastUpdate: latest? new Date(latest.updated_at).toLocaleDateString("en-GB"): new Date(s.created_at||Date.now()).toLocaleDateString("en-GB"), hasProblem: !!(latest?.main_problem && String(latest.main_problem).trim()), needsFollowUp: latest?.employee_status==="يحتاج متابعة" || latest?.employee_status==="يحتاج تدريب" };
      });
      const evaluated = salesTable.filter((s:any)=>s.statusLabel!=="لم يتم التقييم").length;
      const notEvaluated = salesTable.filter((s:any)=>s.statusLabel==="لم يتم التقييم").length;
      const needsFollowUp = salesTable.filter((s:any)=>s.needsFollowUp).length;
      const hasProblems = salesTable.filter((s:any)=>s.hasProblem).length;
      const recentEvaluations = evals.slice().sort((a:any,b:any)=>b.updated_at-a.updated_at).slice(0,5).map((e:any)=>{ const s=sales.find((x:any)=>x._id===e.sales_id||x.id===e.sales_id); return {...e, id: e._id, sales_name:s?.name||"", team_name:s?.team_name||"", team_leader_name:s?.team_leader_name||""}; });
      return NextResponse.json({ totalTeamLeaders: stats.totalTeamLeaders, totalSales: sales.length, completedReports: stats.completedReports, pendingReports: stats.pendingReports, submittedReports: stats.submittedReports, activeTeams: stats.activeTeams, reportsByTeamLeader: stats.reportsByTeamLeader, salesTable, evaluated, notEvaluated, needsFollowUp, hasProblems, recentEvaluations });
    }catch(e: any){ /* fallback */ }
  }
  const db=await getDB();
  const totalTeamLeaders=db.users.filter((u:any)=>u.role==="team_leader").length;
  const totalSales=db.sales.length;
  const completedReports=db.evaluations.filter((e:any)=>e.status==="reviewed").length;
  const pendingReports=db.evaluations.filter((e:any)=>e.status==="draft").length;
  const submittedReports=db.evaluations.filter((e:any)=>e.status==="submitted").length;
  const activeTeams=db.teams.length;
  const reportsByTeamLeader=db.users.filter((u:any)=>u.role==="team_leader").map((l:any)=>{
    const mine=db.evaluations.filter((e:any)=>e.team_leader_id===l.id);
    return { team_leader_name:l.name, completed: mine.filter((e:any)=>e.status==="reviewed").length, pending: mine.filter((e:any)=>e.status==="draft").length, submitted: mine.filter((e:any)=>e.status==="submitted").length, returned: mine.filter((e:any)=>e.status==="returned").length, total: mine.length };
  });
  const salesTable = db.sales.map((s:any)=>{
    const team=db.teams.find((t:any)=>t.id===s.team_id);
    const leader=team? db.users.find((u:any)=>u.id===team.team_leader_id):null;
    const evals=db.evaluations.filter((e:any)=>e.sales_id===s.id).sort((a:any,b:any)=>b.updated_at-a.updated_at);
    const latest=evals[0] || null;
    let statusLabel="لم يتم التقييم";
    let statusColor="slate";
    if(latest){
      if(latest.employee_status) {
        statusLabel=latest.employee_status;
        if(["يحتاج متابعة","يحتاج تدريب"].includes(latest.employee_status)) statusColor="amber";
        else if(latest.employee_status==="مشكلة") statusColor="red";
        else if(latest.employee_status==="جيد"||latest.employee_status==="ممتاز") statusColor="emerald";
        else statusColor="sky";
      } else if(latest.status==="draft" && (!latest.product_knowledge && !latest.strengths)) {
        statusLabel="لم يتم التقييم";
        statusColor="slate";
      } else {
        statusLabel=latest.status==="draft"?"مسودة": latest.status==="submitted"?"مرسل":"مكتمل";
        statusColor=latest.status==="draft"?"slate": latest.status==="submitted"?"amber":"emerald";
      }
    }
    return {
      id:s.id, name:s.name, phone:s.phone, team_name:team?.team_name||"", team_leader_name:leader?.name||"",
      statusLabel, statusColor, latestId: latest?.id || null,
      lastEval: latest?.submitted_at ? new Date(latest.submitted_at).toLocaleDateString("en-GB") : "—",
      lastUpdate: latest? new Date(latest.updated_at).toLocaleDateString("en-GB") : new Date(s.created_at).toLocaleDateString("en-GB"),
      hasProblem: !!(latest?.main_problem && latest.main_problem.trim()),
      needsFollowUp: latest?.employee_status==="يحتاج متابعة" || latest?.employee_status==="يحتاج تدريب"
    };
  });
  const evaluated = salesTable.filter((s:any)=>s.statusLabel!=="لم يتم التقييم").length;
  const notEvaluated = salesTable.filter((s:any)=>s.statusLabel==="لم يتم التقييم").length;
  const needsFollowUp = salesTable.filter((s:any)=>s.needsFollowUp).length;
  const hasProblems = salesTable.filter((s:any)=>s.hasProblem).length;
  const recentEvaluations = db.evaluations.slice().sort((a:any,b:any)=>b.updated_at-a.updated_at).slice(0,5).map((e:any)=>{
    const s=db.sales.find((x:any)=>x.id===e.sales_id);
    const t=db.teams.find((x:any)=>x.id===s?.team_id);
    const l=t? db.users.find((u:any)=>u.id===t.team_leader_id):null;
    return {...e, sales_name:s?.name||"", team_name:t?.team_name||"", team_leader_name:l?.name||""};
  });
  return NextResponse.json({ totalTeamLeaders, totalSales, completedReports, pendingReports, submittedReports, activeTeams, reportsByTeamLeader, salesTable, evaluated, notEvaluated, needsFollowUp, hasProblems, recentEvaluations });
}
