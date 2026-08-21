"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, Button, Input, Badge, Empty, Loading } from "@/components/UI";

export default function TeamLeadersPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", name: "" });

  const token = () => localStorage.getItem("token") || "";

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/users/team-leaders", { headers: { Authorization: `Bearer ${token()}` } });
    const data = await res.json();
    setList(Array.isArray(data) ? data : data.leaders || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: any) => {
    e.preventDefault();
    const res = await fetch("/api/users/team-leaders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) });
    const d = await res.json();
    if (res.ok) { setShow(false); setForm({ username: "", password: "", name: "" }); load(); } else alert(d.error || "فشل");
  };
  const del = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟ سيتم حذف الفريق والمبيعات والتقييمات التابعة له.")) return;
    await fetch(`/api/users/team-leaders/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold">إدارة Team Leaders</h1><p className="text-sm text-slate-500">إضافة وتعديل وحذف قادة الفرق — كلمات المرور تُخزن مشفرة</p></div>
        <Button onClick={() => setShow(true)}>+ إضافة قائد</Button>
      </div>

      <Card>
        <CardHeader title={`القادة (${list.length})`} />
        {list.length === 0 ? <Empty title="لا يوجد قادة" /> : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3 text-right">الاسم</th><th className="p-3">البريد</th><th className="p-3">الفريق</th><th className="p-3">الأعضاء</th><th className="p-3">إجراءات</th></tr></thead>
              <tbody>
                {list.map((u: any) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="p-3 font-bold">{u.name}</td>
                    <td className="p-3">{u.username}</td>
                    <td className="p-3">{u.team_name || "—"}</td>
                    <td className="p-3 text-center"><Badge>{u.member_count ?? 0}</Badge></td>
                    <td className="p-3"><Button size="sm" variant="danger" onClick={() => del(u.id)}>حذف</Button></td>
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
            <h3 className="font-bold">إضافة Team Leader</h3>
            <div><label className="text-sm font-medium">الاسم</label><Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="text-sm font-medium">البريد / اسم المستخدم</label><Input value={form.username} onChange={(e: any) => setForm({ ...form, username: e.target.value })} required /></div>
            <div><label className="text-sm font-medium">كلمة المرور (ستُشفر تلقائياً)</label><Input type="password" value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} required /></div>
            <div className="flex gap-2 justify-end"><Button variant="ghost" type="button" onClick={() => setShow(false)}>إلغاء</Button><Button type="submit">إضافة</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
