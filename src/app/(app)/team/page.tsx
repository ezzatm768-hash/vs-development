"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, Button, Badge, Input, Empty, Loading } from "@/components/UI";

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", join_date: "" });
  const [editing, setEditing] = useState<any>(null);

  const token = () => localStorage.getItem("token") || "";

  const load = async () => {
    setLoading(true);
    const [resSales, resEvals] = await Promise.all([
      fetch("/api/sales", { headers: { Authorization: `Bearer ${token()}` } }),
      fetch("/api/evaluations", { headers: { Authorization: `Bearer ${token()}` } })
    ]);
    const data = await resSales.json();
    const evals = await resEvals.json();
    setMembers(Array.isArray(data) ? data : data.members || []);
    setEvaluations(Array.isArray(evals) ? evals : evals.evaluations || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const getEvalStatus = (salesId: string): "empty"|"partial"|"full" => {
    const ev = evaluations.filter((e:any)=>e.sales_id===salesId).sort((a:any,b:any)=>b.updated_at-a.updated_at)[0];
    if(!ev) return "empty";
    const required = ["product_knowledge","communication","needs_discovery","sales_process","crm_discipline","follow_up_activity","strengths","weaknesses","main_problem","final_notes"];
    const filled = required.filter((k)=> ev[k] && String(ev[k]).trim().length > 3).length;
    if(filled===0) return "empty";
    if(filled===required.length) return "full";
    return "partial";
  };
  const isFullyEvaluated = (salesId: string) => getEvalStatus(salesId)==="full";

  const submit = async (e: any) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/sales/${editing.id}` : "/api/sales";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) });
    if (res.ok) { setShow(false); setEditing(null); setForm({ name: "", join_date: "" }); load(); } else alert("فشل الحفظ");
  };

  const del = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف الموظف؟ سيتم حذف تقييماته أيضاً.")) return;
    await fetch(`/api/sales/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">فريقي</h1>
          <p className="text-sm text-slate-500">إدارة أعضاء فريقك وإضافتهم بسرعة</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: "", join_date: new Date().toISOString().split("T")[0] }); setShow(true); }}>+ إضافة Sales</Button>
      </div>

      <Card>
        <CardHeader title={`الأعضاء (${members.length})`} desc="اضغط على تقييم للانتقال إلى صفحة التقييم" />
        {members.length === 0 ? <Empty title="لا يوجد أعضاء" desc="أضف أول موظف لبدء التقييم" /> : (
          <div className="overflow-auto">
            <table className="w-full text-sm table-fixed" dir="rtl">
              <colgroup><col className="w-[38%]" /><col className="w-[22%]" /><col className="w-[40%]" /></colgroup>
              <thead className="bg-neutral-50 text-neutral-600">
                <tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-center">تاريخ الانضمام</th><th className="p-3 text-center">إجراءات</th></tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const status = getEvalStatus(m.id);
                  return (
                  <tr key={m.id} className="border-t border-neutral-200 hover:bg-neutral-50 h-[56px]">
                    <td className="p-3 font-bold text-black text-right truncate">{m.name}</td>
                    <td className="p-3 text-center text-black font-medium" dir="ltr">{m.join_date ? new Date(m.join_date).toLocaleDateString("en-GB") : "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-1.5 justify-center items-center">
                        <Button size="sm" variant="ghost" className="px-3 py-1.5 text-xs font-bold min-w-[56px] border border-neutral-200" onClick={() => { setEditing(m); setForm({ name: m.name, join_date: m.join_date || "" }); setShow(true); }}>تعديل</Button>
                        <Button size="sm" variant="ghost" className="px-3 py-1.5 text-xs font-bold min-w-[44px] border border-neutral-200" onClick={() => del(m.id)}>حذف</Button>
                        <a href={`/evaluations?sales=${m.id}`} className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-bold inline-flex items-center justify-center min-w-[56px] transition ${status==="full" ? "bg-emerald-600 hover:bg-emerald-700" : status==="partial" ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-black hover:bg-neutral-800"}`}>تقييم</a>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShow(false)} />
          <form onSubmit={submit} className="relative bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg">{editing ? "تعديل موظف" : "إضافة موظف جديد"}</h3>
            <div><label className="text-sm font-medium">الاسم</label><Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="text-sm font-medium">تاريخ الانضمام</label><Input type="date" value={form.join_date} onChange={(e: any) => setForm({ ...form, join_date: e.target.value })} /></div>
            <div className="flex gap-2 justify-end"><Button variant="ghost" type="button" onClick={() => setShow(false)}>إلغاء</Button><Button type="submit">{editing ? "حفظ" : "إضافة"}</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
