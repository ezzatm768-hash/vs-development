"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, Button, Input, Select, Badge, Empty, Loading } from "@/components/UI";

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", period_type: "monthly" });

  const token = () => localStorage.getItem("token") || "";

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/periods", { headers: { Authorization: `Bearer ${token()}` } });
    const data = await res.json();
    setPeriods(Array.isArray(data) ? data : data.periods || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: any) => {
    e.preventDefault();
    const res = await fetch("/api/periods", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) });
    if (res.ok) { setShow(false); setForm({ name: "", start_date: "", end_date: "", period_type: "monthly" }); load(); } else { const d = await res.json(); alert(d.error || "فشل"); }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold">فترات التقييم</h1><p className="text-sm text-slate-500">إنشاء فترة جديدة ينشئ تلقائياً تقييمات مسودة لكل الموظفين</p></div>
        <Button onClick={() => setShow(true)}>+ فترة جديدة</Button>
      </div>

      <Card>
        <CardHeader title={`الفترات (${periods.length})`} />
        {periods.length === 0 ? <Empty title="لا توجد فترات" /> : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3 text-right">الاسم</th><th className="p-3">من</th><th className="p-3">إلى</th><th className="p-3">النوع</th><th className="p-3">الحالة</th></tr></thead>
              <tbody>
                {periods.map((p: any) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="p-3 font-bold">{p.name}</td>
                    <td className="p-3">{p.start_date}</td>
                    <td className="p-3">{p.end_date}</td>
                    <td className="p-3">{p.period_type}</td>
                    <td className="p-3"><Badge color={p.status === "active" ? "emerald" : "slate"}>{p.status === "active" ? "نشطة" : p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShow(false)} />
          <form onSubmit={create} className="relative bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold">فترة جديدة</h3>
            <div><label className="text-sm font-medium">الاسم</label><Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="2026-03" required /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">من</label><Input type="date" value={form.start_date} onChange={(e: any) => setForm({ ...form, start_date: e.target.value })} /></div><div><label className="text-sm font-medium">إلى</label><Input type="date" value={form.end_date} onChange={(e: any) => setForm({ ...form, end_date: e.target.value })} /></div></div>
            <div><label className="text-sm font-medium">النوع</label><Select value={form.period_type} onChange={(e: any) => setForm({ ...form, period_type: e.target.value })}><option value="weekly">أسبوعي</option><option value="monthly">شهري</option></Select></div>
            <div className="flex gap-2 justify-end"><Button variant="ghost" type="button" onClick={() => setShow(false)}>إلغاء</Button><Button type="submit">إنشاء</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
