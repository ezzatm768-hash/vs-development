"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Button, Badge, Input, Select, Textarea, Empty, Loading } from "@/components/UI";

export default function EvaluationsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [activePeriod, setActivePeriod] = useState<any>(null);
  const [selectedSales, setSelectedSales] = useState("");
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({ product_knowledge: "", communication: "", needs_discovery: "", sales_process: "", crm_discipline: "", follow_up_activity: "", strengths: "", weaknesses: "", main_problem: "", employee_status: "جيد", final_notes: "", status: "draft" });
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{msg:string,type:string}|null>(null);
  const showToast = (msg:string,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const token = () => localStorage.getItem("token") || "";

  useEffect(() => {
    Promise.all([
      fetch("/api/sales", { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch("/api/periods", { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch("/api/evaluations", { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
    ]).then(([s, p, e]) => {
      setSales(Array.isArray(s) ? s : s.members || []);
      const periodsArr = Array.isArray(p) ? p : p.periods || [];
      setPeriods(periodsArr);
      setActivePeriod(periodsArr.find((x: any) => x.status === "active") || periodsArr[0] || null);
      setEvaluations(Array.isArray(e) ? e : e.evaluations || []);
      // preselect from query
      const sp = new URLSearchParams(window.location.search);
      const sid = sp.get("sales");
      if (sid) setSelectedSales(sid);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSales || !activePeriod) { setExistingId(null); return; }
    const found = evaluations.find((ev: any) => ev.sales_id === selectedSales && (ev.evaluation_period_id === activePeriod.id || ev.evaluation_period === activePeriod.name));
    if (found) {
      setExistingId(found.id);
      setForm({ product_knowledge: found.product_knowledge || "", communication: found.communication || "", needs_discovery: found.needs_discovery || "", sales_process: found.sales_process || "", crm_discipline: found.crm_discipline || "", follow_up_activity: found.follow_up_activity || "", strengths: found.strengths || "", weaknesses: found.weaknesses || "", main_problem: found.main_problem || "", employee_status: found.employee_status || "جيد", final_notes: found.final_notes || "", status: found.status || "draft" });
    } else {
      setExistingId(null);
      setForm({ product_knowledge: "", communication: "", needs_discovery: "", sales_process: "", crm_discipline: "", follow_up_activity: "", strengths: "", weaknesses: "", main_problem: "", employee_status: "جيد", final_notes: "", status: "draft" });
    }
  }, [selectedSales, activePeriod, evaluations]);

  const currentIndex = sales.findIndex((s:any)=>s.id===selectedSales);
  const nextSales = currentIndex>=0 && currentIndex < sales.length-1 ? sales[currentIndex+1] : null;
  const prevSales = currentIndex>0 ? sales[currentIndex-1] : null;
  const progress = sales.length ? Math.round((evaluations.filter((e:any)=> e.product_knowledge || e.strengths).length / sales.length)*100) : 0;

  const save = async (status: string) => {
    if (!selectedSales) { showToast("اختر الموظف أولاً","error"); return; }
    if(status==="submitted"){
      const hasContent = Object.values(form).some((v:any)=> typeof v==="string" && v.trim().length>5);
      if(!hasContent){ showToast("اكتب تقييم كتابي قبل الإرسال","error"); return; }
      if (!confirm("هل أنت متأكد من إرسال التقييم؟")) return;
    }
    setSaving(true);
    const payload: any = { ...form, sales_id: selectedSales, evaluation_period: activePeriod?.name, evaluation_period_id: activePeriod?.id, status, existingId: existingId || undefined };
    const res = await fetch("/api/evaluations", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.ok) {
      showToast(status === "submitted" ? "تم إرسال التقييم بنجاح" : "تم حفظ المسودة","success");
      const e = await fetch("/api/evaluations", { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
      setEvaluations(Array.isArray(e) ? e : e.evaluations || []);
      if (data.id) setExistingId(data.id);
    } else showToast(data.error || "فشل الحفظ","error");
    setSaving(false);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-lg ${toast.type==="success"?"bg-emerald-600 text-white":"bg-red-600 text-white"}`}>{toast.msg}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">التقييمات</h1>
          <p className="text-sm text-slate-500">اختيار Sales → تقييم → حفظ مسودة → مراجعة → إرسال — {sales.length} موظف، {progress}% مكتمل</p>
        </div>
        {sales.length>0 && <div className="flex items-center gap-2"><div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-sky-600" style={{width:`${progress}%`}} /></div><span className="text-xs text-slate-500">{progress}%</span></div>}
      </div>

      <Card>
        <CardHeader title="اختيار الموظف والفترة" />
        <div className="p-4 grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">الموظف</label>
            <Select value={selectedSales} onChange={(e: any) => setSelectedSales(e.target.value)}>
              <option value="">اختر موظف...</option>
              {sales.map((s: any) => <option key={s.id} value={s.id}>{s.name} — {s.team_name || ""}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">الفترة</label>
            <Select value={activePeriod?.id || ""} onChange={(e: any) => setActivePeriod(periods.find((p: any) => p.id === e.target.value))}>
              {periods.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.status === "active" ? "نشطة" : "مغلقة"})</option>)}
            </Select>
          </div>
          <div className="flex items-end">
            <div className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full">
              الحالة الحالية: <Badge color={form.status === "draft" ? "slate" : form.status === "submitted" ? "amber" : "emerald"}>{form.status === "draft" ? "مسودة" : form.status === "submitted" ? "مرسل" : form.status}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {!selectedSales ? (
        <Empty title="اختر موظفاً للبدء" desc="سيظهر نموذج التقييم بعد الاختيار" />
      ) : (
        <div className="space-y-5 max-w-4xl mx-auto">
          <Card>
            <CardHeader title="التقييم الكتابي التفصيلي" desc="اكتب تقييمك كتابةً لكل معيار — الخط أكبر وواضح" />
            <div className="p-6 grid gap-5">
              {[
                ["product_knowledge", "معرفة المنتج", "اكتب تقييمك لمعرفة المنتج..."],
                ["communication", "التواصل", "كيف يتواصل مع العملاء..."],
                ["needs_discovery", "اكتشاف الاحتياجات", "مدى اكتشاف احتياجات العميل..."],
                ["sales_process", "عملية البيع", "التزامه بخطوات البيع..."],
                ["crm_discipline", "الانضباط في CRM", "استخدامه للـ CRM..."],
                ["follow_up_activity", "المتابعة والنشاط", "سرعة وجودة المتابعة..."],
              ].map(([key, label, ph]) => (
                <div key={key}>
                  <label className="text-[15px] font-bold text-black mb-2 block">{label}</label>
                  <Textarea rows={3} value={form[key]} onChange={(e: any) => setForm({ ...form, [key]: e.target.value })} placeholder={ph} className="text-[15px] leading-6 placeholder:text-neutral-400 min-h-[90px]" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="الملاحظات النوعية" />
            <div className="p-6 space-y-5">
              <div><label className="text-[15px] font-bold text-black mb-2 block">نقاط القوة</label><Textarea rows={3} value={form.strengths} onChange={(e: any) => setForm({ ...form, strengths: e.target.value })} placeholder="اذكر أبرز نقاط القوة..." className="text-[15px] leading-6 min-h-[90px]" /></div>
              <div><label className="text-[15px] font-bold text-black mb-2 block">نقاط الضعف</label><Textarea rows={3} value={form.weaknesses} onChange={(e: any) => setForm({ ...form, weaknesses: e.target.value })} className="text-[15px] leading-6 min-h-[90px]" /></div>
              <div><label className="text-[15px] font-bold text-black mb-2 block">المشكلة الأساسية</label><Textarea rows={3} value={form.main_problem} onChange={(e: any) => setForm({ ...form, main_problem: e.target.value })} placeholder="ما هي المشكلة الرئيسية التي تواجه الموظف؟" className="text-[15px] leading-6 min-h-[90px]" /></div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><label className="text-[15px] font-bold text-black mb-2 block">حالة الموظف</label><Select value={form.employee_status} onChange={(e: any) => setForm({ ...form, employee_status: e.target.value })} className="text-[15px] h-[48px]"><option>ممتاز</option><option>جيد</option><option>مستقر</option><option>يحتاج متابعة</option><option>يحتاج تدريب</option><option>مشكلة</option><option>لم يتم التقييم</option></Select></div>
                <div><label className="text-[15px] font-bold text-black mb-2 block">ملاحظات نهائية</label><Textarea rows={3} value={form.final_notes} onChange={(e: any) => setForm({ ...form, final_notes: e.target.value })} placeholder="ملاحظات ختامية..." className="text-[15px] leading-6 min-h-[90px]" /></div>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={!prevSales} onClick={()=>prevSales&&setSelectedSales(prevSales.id)}>← السابق {prevSales? `(${prevSales.name})`:""}</Button>
              <Button variant="ghost" size="sm" disabled={!nextSales} onClick={()=>nextSales&&setSelectedSales(nextSales.id)}>التالي {nextSales? `(${nextSales.name})`:""} →</Button>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" disabled={saving} onClick={() => save("draft")}>{saving?"جاري الحفظ...":"حفظ مسودة"}</Button>
              <Button disabled={saving} onClick={() => save("submitted")}>إرسال التقييم</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
