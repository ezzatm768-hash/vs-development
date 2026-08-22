"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Badge, Empty, Loading, Button } from "@/components/UI";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [evals, setEvals] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [drawerEval, setDrawerEval] = useState<any>(null);

  const token = () => localStorage.getItem("token") || "";

  useEffect(() => {
    fetch("/api/teams", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((d) => setTeams(Array.isArray(d) ? d : d.teams || []))
      .finally(() => setLoading(false));
  }, []);

  const openTeam = async (team:any)=>{
    setSelected(team);
    setLoadingMembers(true);
    const [salesRes, evalRes] = await Promise.all([
      fetch("/api/sales", { headers: { Authorization: `Bearer ${token()}` } }).then(r=>r.json()),
      fetch("/api/evaluations", { headers: { Authorization: `Bearer ${token()}` } }).then(r=>r.json()),
    ]);
    const allSales = Array.isArray(salesRes) ? salesRes : salesRes.members || [];
    const allEvals = Array.isArray(evalRes) ? evalRes : evalRes.evaluations || [];
    setMembers(allSales.filter((s:any)=> s.team_id===team.id));
    setEvals(allEvals);
    setLoadingMembers(false);
  };

  const getStatus = (saleId:string)=>{
    const ev = evals.filter((e:any)=>e.sales_id===saleId).sort((a:any,b:any)=> (b.updated_at||0)-(a.updated_at||0))[0];
    if(!ev) return { label:"لم يتم التقييم", color:"slate", ev:null };
    const required=["product_knowledge","communication","needs_discovery","sales_process","crm_discipline","follow_up_activity","strengths","weaknesses","main_problem","final_notes"];
    const filled = required.filter((k)=> ev[k] && String(ev[k]).trim().length>0).length;
    if(filled===0) return { label:"لم يتم التقييم", color:"slate", ev };
    if(filled<required.length) return { label:"برجاء الإستكمال", color:"red", ev };
    const label = ev.employee_status || (ev.status==="draft"?"مسودة": ev.status==="submitted"?"مرسل":"مكتمل");
    const color = label==="يحتاج متابعة"||label==="يحتاج تدريب"?"amber": label==="مشكلة"?"red": label==="جيد"||label==="ممتاز"?"emerald":"sky";
    return { label, color, ev };
  };

  const openEval = async (saleId:string)=>{
    const st = getStatus(saleId);
    if(!st.ev){ setDrawerEval(null); return; }
    const res = await fetch(`/api/evaluations/${st.ev.id}`, { headers:{ Authorization:`Bearer ${token()}` } }).then(r=>r.json());
    setDrawerEval(res);
  };

  if (loading) return <Loading />;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">إدارة الفرق</h1>
      <Card>
        <CardHeader title={`الفرق (${teams.length})`} />
        {teams.length === 0 ? <Empty title="لا توجد فرق" /> : (
          <div className="grid md:grid-cols-2 gap-4 p-4">
            {teams.map((t: any) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-lg">{t.team_name}</div>
                  <div className="text-sm text-slate-500">القائد: {t.leader_name || t.team_leader_id || "—"}</div>
                  <div className="mt-2"><Badge color="sky">{t.member_count ?? 0} عضو</Badge></div>
                </div>
                <Button size="sm" className="mt-4 w-full" onClick={()=>openTeam(t)}>عرض الفريق</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={()=>setSelected(null)} />
          <div className="w-full max-w-3xl bg-white h-full overflow-auto shadow-2xl animate-[slideIn_0.25s]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <div className="font-black text-lg">{selected.team_name}</div>
                <div className="text-sm text-slate-500">القائد: {selected.leader_name || "—"} • {members.length} عضو</div>
              </div>
              <Button variant="ghost" onClick={()=>setSelected(null)}>إغلاق</Button>
            </div>
            <div className="p-4">
              {loadingMembers ? <Loading /> : members.length===0 ? <Empty title="لا يوجد أعضاء" desc="هذا الفريق فارغ" /> : (
                <div className="overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm table-fixed" dir="rtl">
                    <colgroup><col className="w-[22%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[22%]" /><col className="w-[24%]" /></colgroup>
                    <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3 text-right font-bold">الاسم</th><th className="p-3 text-center font-bold">تاريخ الانضمام</th><th className="p-3 text-center font-bold">الحالة</th><th className="p-3 text-center font-bold">آخر تحديث</th><th className="p-3 text-center font-bold">عرض التقييم</th></tr></thead>
                    <tbody>
                      {members.map((m:any)=>{
                        const st = getStatus(m.id);
                        const lastUpdate = st.ev ? new Date(st.ev.updated_at).toLocaleString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) : (m.created_at ? new Date(m.created_at).toLocaleString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—");
                        return (
                          <tr key={m.id} className="border-t border-slate-200 hover:bg-slate-50 h-[58px] transition">
                            <td className="p-3 font-bold text-black text-right truncate">{m.name}</td>
                            <td className="p-3 text-center text-slate-700 text-xs font-medium" dir="ltr">{m.join_date ? new Date(m.join_date).toLocaleDateString("en-GB") : "—"}</td>
                            <td className="p-3 text-center"><Badge color={st.color as any}>{st.label}</Badge></td>
                            <td className="p-3 text-center text-slate-600 text-xs font-medium" dir="ltr">{lastUpdate}</td>
                            <td className="p-3 text-center">
                              {st.ev ? <Button size="sm" onClick={()=>openEval(m.id)} className="min-w-[84px] shadow-sm">عرض التقييم</Button> : <span className="text-xs text-slate-400">لا يوجد</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {drawerEval && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={()=>setDrawerEval(null)} />
          <div className="w-full max-w-xl bg-white h-full overflow-auto shadow-2xl">
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <div><div className="font-black text-lg">{drawerEval.sales_name || "التقييم"}</div><div className="text-sm text-slate-500">{drawerEval.team_leader_name || ""} • {drawerEval.evaluation_period || ""}</div></div>
              <Button variant="ghost" onClick={()=>setDrawerEval(null)}>إغلاق</Button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {[
                ["product_knowledge","معرفة المنتج"],
                ["communication","التواصل"],
                ["needs_discovery","اكتشاف الاحتياجات"],
                ["sales_process","عملية البيع"],
                ["crm_discipline","الالتزام بالـCRM"],
                ["follow_up_activity","المتابعة والنشاط"],
              ].map(([k,label])=>(
                <div key={k}><div className="font-bold">{label}</div><div className="mt-1 p-3 rounded-xl border bg-slate-50 min-h-[40px] whitespace-pre-wrap">{drawerEval[k]||"—"}</div></div>
              ))}
              <div><div className="font-bold">نقاط القوة</div><div className="mt-1 p-3 rounded-xl border bg-slate-50 whitespace-pre-wrap">{drawerEval.strengths||"—"}</div></div>
              <div><div className="font-bold">نقاط الضعف</div><div className="mt-1 p-3 rounded-xl border bg-slate-50 whitespace-pre-wrap">{drawerEval.weaknesses||"—"}</div></div>
              <div><div className="font-bold">المشكلة الأساسية</div><div className="mt-1 p-3 rounded-xl border bg-slate-50 whitespace-pre-wrap">{drawerEval.main_problem||"—"}</div></div>
              <div><div className="font-bold">ملاحظات نهائية</div><div className="mt-1 p-3 rounded-xl border bg-slate-50 whitespace-pre-wrap">{drawerEval.final_notes||"—"}</div></div>
              <div className="flex gap-2 pt-2">
                <Link href={`/reports/${drawerEval._id || drawerEval.id}`} className="flex-1 text-center px-4 py-2.5 rounded-xl bg-black text-white font-bold">فتح التقرير الكامل</Link>
                <Button variant="ghost" className="flex-1" onClick={()=>setDrawerEval(null)}>إغلاق</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
