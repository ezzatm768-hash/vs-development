"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, Badge, Empty, Button, Input, Select } from "@/components/UI";
import Link from "next/link";

function CountUp({ value, suffix="" }: { value: number, suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplay(0); return; }
    const duration = 600;
    const step = 16;
    const inc = end / (duration / step);
    const id = setInterval(() => {
      start += inc;
      if (start >= end) { setDisplay(end); clearInterval(id); }
      else setDisplay(Math.floor(start));
    }, step);
    return () => clearInterval(id);
  }, [value]);
  return <span>{display}{suffix}</span>;
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", join_date: new Date().toISOString().split("T")[0] });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string|null>(null);

  const loadData = () => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    setUser(u);
    const token = localStorage.getItem("token") || "";
    const url = u?.role === "admin" ? "/api/admin/dashboard" : "/api/team/dashboard";
    setLoading(true);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAddSales = async (e:any)=>{
    e.preventDefault();
    if(!addForm.name.trim()) return;
    setAdding(true);
    const token = localStorage.getItem("token") || "";
    const res = await fetch("/api/sales", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+token}, body: JSON.stringify(addForm)});
    const d = await res.json();
    if(res.ok){
      setShowAdd(false);
      setAddForm({ name:"", join_date: new Date().toISOString().split("T")[0]});
      setToast("تمت إضافة العضو بنجاح");
      setTimeout(()=>setToast(null),2000);
      loadData();
    } else {
      setToast(d.error || "فشل الإضافة");
      setTimeout(()=>setToast(null),2000);
    }
    setAdding(false);
  };

  const openDetails = async (saleId: string) => {
    const token = localStorage.getItem("token") || "";
    const evals = await fetch(`/api/evaluations`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json());
    const latest = (Array.isArray(evals)? evals: []).filter((e:any)=>e.sales_id===saleId).sort((a:any,b:any)=>b.updated_at-a.updated_at)[0];
    if(!latest) { setSelected({id:saleId}); return; }
    const detail = await fetch(`/api/evaluations/${latest.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json());
    setSelected(saleId);
    setDrawerData(detail);
  };

  if (loading) return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({length:4}).map((_,i)=><div key={i} className="h-[118px] rounded-2xl border border-neutral-200 bg-white p-5"><div className="h-3 w-24 skeleton rounded"/><div className="h-8 w-16 skeleton rounded mt-4"/><div className="h-1 w-full skeleton rounded-full mt-4"/></div>)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[260px] rounded-2xl border border-neutral-200 bg-white skeleton"/>
        <div className="h-[260px] rounded-2xl border border-neutral-200 bg-white skeleton"/>
      </div>
    </div>
  );
  if (!data) return <Empty title="لا توجد بيانات" />;

  if (user?.role === "admin") {
    const filtered = (data.salesTable || []).filter((s:any)=>{
      if(search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.team_leader_name.toLowerCase().includes(search.toLowerCase())) return false;
      if(statusFilter && s.statusLabel !== statusFilter) return false;
      return true;
    });
    return (
      <div className="space-y-6 animate-[fadeIn_0.35s_ease-out]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-black tracking-tight">لوحة تحكم الأدمن</h1>
          <div className="text-sm text-neutral-500">نظرة شاملة على الفرق والمبيعات</div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <Stat title="قادة الفرق" value={data.totalTeamLeaders} color="sky" delay={0} />
          <Stat title="إجمالي المبيعات" value={data.totalSales} color="indigo" delay={80} />
          <Stat title="تم تقييمهم" value={data.evaluated} color="emerald" delay={160} />
          <Stat title="لم يتم تقييمهم" value={data.notEvaluated} color="slate" delay={240} />
          <Stat title="يحتاجون متابعة" value={data.needsFollowUp} color="amber" delay={320} />
          <Stat title="لديهم مشاكل" value={data.hasProblems} color="red" delay={400} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
            <CardHeader title="أداء قادة الفرق" desc="ملخص حالة التقارير لكل قائد" />
            <div className="overflow-auto">
              <table className="w-full text-sm" dir="rtl">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr><th className="p-3 text-right">القائد</th><th className="p-3 text-center">مسودة</th><th className="p-3 text-center">مرسل</th><th className="p-3 text-center">مكتمل</th><th className="p-3 text-center">الإجمالي</th></tr>
                </thead>
                <tbody>
                  {(data.reportsByTeamLeader||[]).map((r: any, i: number) => (
                    <tr key={i} className="border-t border-neutral-200 hover:bg-neutral-50 transition"><td className="p-3 font-bold text-black">{r.team_leader_name}</td><td className="p-3 text-center">{r.pending}</td><td className="p-3 text-center">{r.submitted}</td><td className="p-3 text-center">{r.completed}</td><td className="p-3 text-center font-black">{r.total}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader title="آخر التقييمات" desc="آخر 5 تحديثات" />
            <div className="p-3 space-y-2">
              {(data.recentEvaluations||[]).length===0 ? <Empty title="لا يوجد" /> : data.recentEvaluations.map((e:any)=>(
                <div key={e.id} className="rounded-xl border border-neutral-200 p-3 flex items-center justify-between hover:bg-neutral-50 transition">
                  <div className="text-right"><div className="font-bold text-sm text-black">{e.sales_name}</div><div className="text-xs text-neutral-500" dir="ltr">{new Date(e.updated_at).toLocaleDateString("en-GB")} • {e.team_name}</div></div>
                  <Link href={`/reports/${e.id}`} className="text-xs font-bold text-black hover:underline">عرض</Link>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title={`قائمة المبيعات (${filtered.length})`} desc="فلتر حسب الحالة وابحث بالاسم — اضغط عرض للتفاصيل بدون مغادرة الصفحة" action={
            <div className="flex gap-2">
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-xs">⌕</span>
                <Input placeholder="ابحث بالاسم أو القائد..." value={search} onChange={(e:any)=>setSearch(e.target.value)} className="w-44 pr-8 bg-neutral-50 border-neutral-300 placeholder:text-neutral-600 text-sm font-medium" />
              </div>
              <Select value={statusFilter} onChange={(e:any)=>setStatusFilter(e.target.value)} className="w-36">
                <option value="">كل الحالات</option>
                <option>جيد</option><option>ممتاز</option><option>مستقر</option><option>يحتاج متابعة</option><option>يحتاج تدريب</option><option>مشكلة</option><option>لم يتم التقييم</option>
              </Select>
            </div>
          } />
          <div className="hidden md:block overflow-auto">
            <table className="w-full text-sm table-fixed" dir="rtl">
              <colgroup><col className="w-[22%]" /><col className="w-[20%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[16%]" /></colgroup>
              <thead className="bg-neutral-50 text-neutral-600"><tr><th className="p-3 text-right">اسم المبيعات</th><th className="p-3 text-right">Team Leader</th><th className="p-3 text-center">الحالة</th><th className="p-3 text-center" title="تاريخ إرسال التقييم">آخر تقييم</th><th className="p-3 text-center" title="تاريخ آخر تعديل">آخر تحديث</th><th className="p-3 text-center">عرض</th></tr></thead>
              <tbody>
                {filtered.map((s:any)=>(
                  <tr key={s.id} className="border-t border-neutral-200 hover:bg-neutral-50 h-[56px] transition">
                    <td className="p-3 font-bold text-black truncate text-right">{s.name}</td>
                    <td className="p-3 text-right truncate">{s.team_leader_name}</td>
                    <td className="p-3 text-center"><Badge color={s.statusColor as any}>{s.statusLabel}</Badge></td>
                    <td className="p-3 text-center font-medium text-black" dir="ltr">{s.lastEval}</td>
                    <td className="p-3 text-center font-medium text-black" dir="ltr">{s.lastUpdate}</td>
                    <td className="p-3 text-center"><button onClick={()=>openDetails(s.id)} className="px-3.5 py-1.5 rounded-xl bg-white border border-neutral-200 text-black text-xs font-bold hover:bg-neutral-50 transition min-w-[56px]">عرض</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden p-3 grid gap-3">
            {filtered.map((s:any)=>(
              <div key={s.id} className="rounded-2xl border border-slate-200 p-4 bg-white hover:shadow-sm transition">
                <div className="flex items-center justify-between"><span className="font-bold text-black">{s.name}</span><Badge color={s.statusColor as any}>{s.statusLabel}</Badge></div>
                <div className="text-xs text-neutral-500 mt-1">{s.team_name} • {s.team_leader_name}</div>
                <div className="text-xs text-neutral-500 mt-1" dir="ltr">آخر تقييم: {s.lastEval} — تحديث: {s.lastUpdate}</div>
                <button onClick={()=>openDetails(s.id)} className="mt-3 w-full px-3 py-2 rounded-xl bg-black text-white text-xs font-bold">عرض التفاصيل</button>
              </div>
            ))}
          </div>
        </Card>

        {drawerData && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={()=>{setDrawerData(null); setSelected(null);}} />
            <div className="w-full max-w-xl bg-white h-full overflow-auto shadow-2xl animate-[slideIn_0.25s]">
              <div className="p-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
                <div><div className="font-black text-lg text-black">{drawerData.sales_name}</div><div className="text-sm text-neutral-500">{drawerData.team_leader_name} • {drawerData.evaluation_period}</div></div>
                <Button variant="ghost" onClick={()=>{setDrawerData(null); setSelected(null);}}>إغلاق</Button>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">الحالة الحالية</div><div className="mt-1"><Badge>{drawerData.employee_status||drawerData.status}</Badge></div></div>
                  <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">آخر تحديث</div><div className="font-bold text-black" dir="ltr">{new Date(drawerData.updated_at).toLocaleDateString("en-GB")}</div></div>
                </div>
                {[
                  ["product_knowledge","معرفة المنتج"],
                  ["communication","التواصل"],
                  ["needs_discovery","اكتشاف احتياج العميل"],
                  ["sales_process","عملية البيع"],
                  ["crm_discipline","الالتزام بالـCRM"],
                  ["follow_up_activity","المتابعة والنشاط"],
                ].map(([k,label])=>(
                  <div key={k}><div className="font-bold text-black">{label}</div><div className="mt-1 p-3 rounded-xl bg-white border border-neutral-200 min-h-[50px] whitespace-pre-wrap">{drawerData[k]||"—"}</div></div>
                ))}
                <div><div className="font-bold text-black">نقاط القوة</div><div className="mt-1 p-3 rounded-xl bg-white border border-neutral-200 whitespace-pre-wrap">{drawerData.strengths||"—"}</div></div>
                <div><div className="font-bold text-black">نقاط الضعف</div><div className="mt-1 p-3 rounded-xl bg-white border border-neutral-200 whitespace-pre-wrap">{drawerData.weaknesses||"—"}</div></div>
                <div><div className="font-bold text-black">المشكلة الأساسية</div><div className="mt-1 p-3 rounded-xl bg-white border border-neutral-200 whitespace-pre-wrap">{drawerData.main_problem||"—"}</div></div>
                <div><div className="font-bold text-black">ملاحظات نهائية</div><div className="mt-1 p-3 rounded-xl bg-white border border-neutral-200 whitespace-pre-wrap">{drawerData.final_notes||"—"}</div></div>
                <Link href={`/reports/${drawerData.id}`} className="flex-1 text-center block px-4 py-2.5 rounded-xl bg-black text-white font-bold">فتح صفحة التقرير الكاملة</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Team Leader - مع جدول الأعضاء (الواجهة القديمة المطلوبة)
  const members = data.members || [];
  const evals = data.reports || [];
  const evaluatedIds = new Set(evals.filter((e:any)=> e.product_knowledge || e.communication || e.strengths).map((e:any)=>e.sales_id));
  const evaluated = members.filter((m:any)=>evaluatedIds.has(m.id)).length;
  const notEvaluated = members.length - evaluated;
  const needsFollowUp = evals.filter((e:any)=>e.employee_status==="يحتاج متابعة" || e.employee_status==="يحتاج تدريب").length;
  const hasProblems = evals.filter((e:any)=>e.main_problem && e.main_problem.trim()).length;

  return (
    <div className="space-y-6 animate-[fadeIn_0.35s_ease-out]">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-black text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">{toast}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-black tracking-tight">فريقي — {data.team?.team_name||""}</h1>
        <Button onClick={()=>setShowAdd(true)} className="bg-[#0F172A] text-white hover:bg-black">+ إضافة Sales</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Stat title="إجمالي الفريق" value={members.length} color="indigo" />
        <Stat title="تم تقييمهم" value={evaluated} color="emerald" />
        <Stat title="لم يتم تقييمهم" value={notEvaluated} color="slate" />
        <Stat title="يحتاجون متابعة" value={needsFollowUp} color="amber" />
        <Stat title="لديهم مشاكل" value={hasProblems} color="red" />
      </div>

      <Card>
        <CardHeader title={`أعضاء الفريق (${members.length})`} desc="اضغط تقييم للانتقال مباشرة — البحث للوصول السريع" action={
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">⌕</span>
            <Input placeholder="ابحث بالاسم..." value={search} onChange={(e:any)=>setSearch(e.target.value)} className="w-44 pr-9 bg-slate-50 border-slate-200 placeholder:text-slate-600 text-sm font-medium" />
          </div>
        } />
        {members.length===0 ? <Empty title="لا يوجد Sales" desc="أضف أول موظف لبدء التقييم" /> : (
          <>
            <div className="hidden md:block overflow-auto">
              <table className="w-full text-sm table-fixed" dir="rtl">
                <colgroup><col className="w-[7%]" /><col className="w-[23%]" /><col className="w-[15%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[23%]" /></colgroup>
                <thead className="bg-slate-50 text-slate-600">
                  <tr><th className="p-3 text-center">#</th><th className="p-3 text-right">الاسم</th><th className="p-3 text-center">الحالة</th><th className="p-3 text-center" title="تاريخ إرسال التقييم">آخر تقييم</th><th className="p-3 text-center" title="تاريخ آخر تعديل">آخر تحديث</th><th className="p-3 text-center">إجراءات</th></tr>
                </thead>
                <tbody>
                  {members.filter((m:any)=> !search || m.name.toLowerCase().includes(search.toLowerCase())).map((m:any, idx:number)=>{
                    const ev = evals.filter((e:any)=>e.sales_id===m.id).sort((a:any,b:any)=>b.updated_at-a.updated_at)[0];
                    const required = ["product_knowledge","communication","needs_discovery","sales_process","crm_discipline","follow_up_activity","strengths","weaknesses","main_problem","final_notes"];
                    const filled = ev ? required.filter((k)=> ev[k] && String(ev[k]).trim().length>0).length : 0;
                    let statusLabel = "لم يتم التقييم";
                    let color: string = "slate";
                    if(ev){
                      if(filled===0){ statusLabel = ev.employee_status || "لم يتم التقييم"; color = "slate"; }
                      else if(filled < required.length){ statusLabel = "برجاء الإستكمال"; color = "red"; }
                      else { statusLabel = ev.employee_status || (ev.status==="draft"?"مسودة": ev.status==="submitted"?"مرسل":"مكتمل"); color = statusLabel==="يحتاج متابعة"||statusLabel==="يحتاج تدريب"?"amber": statusLabel==="مشكلة"?"red": statusLabel==="جيد"||statusLabel==="ممتاز"?"emerald": statusLabel==="برجاء الإستكمال"?"red":"sky"; }
                    }
                    return (
                      <tr key={m.id} className="border-t border-slate-200 hover:bg-slate-50 h-[56px] transition">
                        <td className="p-3 text-center font-bold text-neutral-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-black truncate text-right">{m.name}</td>
                        <td className="p-3 text-center"><Badge color={color as any}>{statusLabel}</Badge></td>
                        <td className="p-3 text-center font-medium text-black" dir="ltr">{ev?.submitted_at ? new Date(ev.submitted_at).toLocaleDateString("en-GB") : "—"}</td>
                        <td className="p-3 text-center font-medium text-black" dir="ltr">{ev? new Date(ev.updated_at).toLocaleDateString("en-GB"): new Date(m.created_at).toLocaleDateString("en-GB")}</td>
                        <td className="p-3"><div className="flex gap-1.5 justify-center items-center"><Link href={`/evaluations?sales=${m.id}`} className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-black transition min-w-[52px] text-center">تقييم</Link><button onClick={()=>openDetails(m.id)} className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-black text-xs font-bold hover:bg-slate-50 transition min-w-[52px]">عرض</button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden p-3 grid gap-3">
              {members.filter((m:any)=> !search || m.name.toLowerCase().includes(search.toLowerCase())).map((m:any)=>{
                const ev = evals.filter((e:any)=>e.sales_id===m.id).sort((a:any,b:any)=>b.updated_at-a.updated_at)[0];
                const requiredM = ["product_knowledge","communication","needs_discovery","sales_process","crm_discipline","follow_up_activity","strengths","weaknesses","main_problem","final_notes"];
                const filledM = ev ? requiredM.filter((k)=> ev[k] && String(ev[k]).trim().length>0).length : 0;
                let statusLabelM = "لم يتم التقييم";
                if(ev){ if(filledM===0) statusLabelM = ev.employee_status || "لم يتم التقييم"; else if(filledM < requiredM.length) statusLabelM = "برجاء الإستكمال"; else statusLabelM = ev.employee_status || (ev.status==="draft"?"مسودة":"مرسل"); }
                const colorM = statusLabelM==="برجاء الإستكمال"?"red":undefined;
                return (
                  <div key={m.id} className="rounded-2xl border border-slate-200 p-4 bg-white">
                    <div className="flex items-center justify-between"><span className="font-bold text-black">{m.name}</span><Badge color={colorM as any}>{statusLabelM}</Badge></div>
                    <div className="text-xs text-slate-500 mt-1 flex gap-3" dir="ltr"><span>آخر تقييم: {ev?.submitted_at? new Date(ev.submitted_at).toLocaleDateString("en-GB"):"—"}</span><span>تحديث: {ev? new Date(ev.updated_at).toLocaleDateString("en-GB"): new Date(m.created_at).toLocaleDateString("en-GB")}</span></div>
                    <div className="flex gap-2 mt-3"><Link href={`/evaluations?sales=${m.id}`} className="flex-1 text-center px-3 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-bold">تقييم</Link><button onClick={()=>openDetails(m.id)} className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-black text-xs font-bold">عرض</button></div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {drawerData && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={()=>{setDrawerData(null); setSelected(null);}} />
          <div className="w-full max-w-xl bg-white h-full overflow-auto shadow-2xl animate-[slideIn_0.25s]">
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white"><div className="font-black text-black">{drawerData.sales_name||"التفاصيل"}</div><Button variant="ghost" onClick={()=>{setDrawerData(null); setSelected(null);}}>إغلاق</Button></div>
            <div className="p-5 space-y-3 text-sm">
              {[
                ["product_knowledge","معرفة المنتج"],
                ["communication","التواصل"],
                ["needs_discovery","اكتشاف احتياج العميل"],
                ["sales_process","عملية البيع"],
                ["crm_discipline","الالتزام بالـCRM"],
                ["follow_up_activity","المتابعة والنشاط"],
              ].map(([k,label])=>(
                <div key={k}><div className="font-bold text-black">{label}</div><div className="mt-1 p-3 rounded-xl border bg-white min-h-[40px] whitespace-pre-wrap">{drawerData[k]||"—"}</div></div>
              ))}
              <Link href={`/reports/${drawerData.id}`} className="block text-center px-4 py-2.5 rounded-xl bg-[#0F172A] text-white font-bold mt-4">فتح التقرير الكامل</Link>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowAdd(false)} />
          <form onSubmit={handleAddSales} className="relative bg-white rounded-[20px] p-6 w-full max-w-md space-y-4 shadow-2xl animate-[fadeIn_0.2s] border border-slate-200">
            <h3 className="font-black text-lg text-black text-center">إضافة موظف جديد</h3>
            <p className="text-xs text-slate-500 text-center">سيظهر مباشرة في فريقك</p>
            <div><label className="text-sm font-bold text-black mb-1.5 block">الاسم *</label><Input value={addForm.name} onChange={(e:any)=>setAddForm({...addForm, name:e.target.value})} required placeholder="اسم الموظف" /></div>
            <div><label className="text-sm font-bold text-black mb-1.5 block">تاريخ الانضمام</label><Input type="date" value={addForm.join_date} onChange={(e:any)=>setAddForm({...addForm, join_date:e.target.value})} /></div>
            <div className="flex gap-2 justify-end pt-2"><Button variant="ghost" type="button" onClick={()=>setShowAdd(false)}>إلغاء</Button><Button type="submit" disabled={adding} className="bg-[#0F172A] text-white">{adding?"جاري الإضافة...":"إضافة"}</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ title, value, color, delay=0 }: any) {
  const c: any = {
    sky: "from-sky-500 to-sky-600",
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-500",
    slate: "from-slate-400 to-slate-500",
    red: "from-red-500 to-rose-600",
    black: "from-slate-900 to-slate-800",
    neutral800: "from-slate-800 to-slate-700",
    neutral600: "from-slate-600 to-slate-500",
    neutral400: "from-slate-400 to-slate-300"
  };
  return (
    <Card className="p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200" style={{animation:`fadeIn 0.4s ease-out ${delay}ms both`}}>
      <div className="text-xs font-bold text-slate-500">{title}</div>
      <div className="text-2xl font-black mt-1 text-slate-900"><CountUp value={value} /></div>
      <div className={`h-1 mt-3 rounded-full bg-gradient-to-r ${c[color]||c.slate}`} />
    </Card>
  );
}
