"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, Button, Input, Badge, Empty, Loading } from "@/components/UI";

export default function TeamLeadersPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", name: "" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{msg:string,type:"success"|"error"}|null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState({ username: "", name: "", password: "" });
  const [saving, setSaving] = useState(false);

  const token = () => {
    if (typeof window !== "undefined") return localStorage.getItem("token") || "";
    return "";
  };

  const showToast = (msg:string, type:"success"|"error"="success")=>{
    setToast({msg,type});
    setTimeout(()=>setToast(null),2500);
  };

  const load = async () => {
    setLoading(true);
    try{
      const res = await fetch("/api/users/team-leaders", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if(res.ok) setList(Array.isArray(data) ? data : data.leaders || []);
      else showToast(data.error || "فشل تحميل القادة","error");
    } catch{ showToast("خطأ في الاتصال","error"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: any) => {
    e.preventDefault();
    if(!form.name.trim() || !form.username.trim() || !form.password.trim()){
      showToast("جميع الحقول مطلوبة","error");
      return;
    }
    setAdding(true);
    try{
      const res = await fetch("/api/users/team-leaders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(form) });
      const d = await res.json();
      if (res.ok) {
        setShow(false);
        setForm({ username: "", password: "", name: "" });
        showToast("تمت إضافة القائد بنجاح");
        load();
      } else showToast(d.error || "فشل الإضافة","error");
    } catch{
      showToast("خطأ في الشبكة","error");
    }
    setAdding(false);
  };
  const del = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟ سيتم حذف الفريق والمبيعات والتقييمات التابعة له.")) return;
    const res = await fetch(`/api/users/team-leaders/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    const d = await res.json().catch(()=>({}));
    if(res.ok){ showToast("تم الحذف"); load(); } else showToast(d.error||"فشل الحذف","error");
  };

  const openEdit = (u:any)=>{
    setEditing(u);
    setEditForm({ username: u.username, name: u.name, password: "" });
  };
  const saveEdit = async (e:any)=>{
    e.preventDefault();
    if(!editing) return;
    if(!editForm.name.trim() || !editForm.username.trim()){
      showToast("الاسم والبريد مطلوبان","error");
      return;
    }
    setSaving(true);
    try{
      const payload:any={ name: editForm.name.trim(), username: editForm.username.trim() };
      if(editForm.password.trim()) payload.password = editForm.password.trim();
      const res = await fetch(`/api/users/team-leaders/${editing.id}`, { method: "PUT", headers: { "Content-Type":"application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(payload)});
      const d = await res.json();
      if(res.ok){
        showToast("تم تعديل بيانات القائد بنجاح");
        setEditing(null);
        load();
      } else showToast(d.error||"فشل التعديل","error");
    } catch{ showToast("خطأ في الشبكة","error"); }
    setSaving(false);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {toast && <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-xl text-sm font-bold shadow-xl ${toast.type==="success"?"bg-emerald-600 text-white":"bg-red-600 text-white"}`}>{toast.msg}</div>}
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-extrabold">إدارة Team Leaders</h1><p className="text-sm text-slate-500">إضافة وتعديل وحذف قادة الفرق — كلمات المرور تُخزن مشفرة</p></div>
        <Button onClick={() => setShow(true)}>+ إضافة قائد</Button>
      </div>

      <Card>
        <CardHeader title={`القادة (${list.length})`} />
        {list.length === 0 ? <Empty title="لا يوجد قادة" /> : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">البريد</th><th className="p-3 text-right">الفريق</th><th className="p-3 text-center">الأعضاء</th><th className="p-3 text-center">إجراءات</th></tr></thead>
              <tbody>
                {list.map((u: any) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="p-3 font-bold text-right">{u.name}</td>
                    <td className="p-3 text-right">{u.username}</td>
                    <td className="p-3 text-right">{u.team_name || "—"}</td>
                    <td className="p-3 text-center"><Badge>{u.member_count ?? 0}</Badge></td>
                    <td className="p-3"><div className="flex gap-2 justify-center"><Button size="sm" variant="ghost" onClick={() => openEdit(u)}>تعديل</Button><Button size="sm" variant="danger" onClick={() => del(u.id)}>حذف</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShow(false)} />
          <form onSubmit={create} className="relative bg-white rounded-[20px] p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-black text-lg">إضافة Team Leader</h3>
            <div><label className="text-sm font-bold mb-1.5 block">الاسم</label><Input placeholder="اسم القائد" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="text-sm font-bold mb-1.5 block">البريد / اسم المستخدم</label><Input placeholder="example@gmail.com" value={form.username} onChange={(e: any) => setForm({ ...form, username: e.target.value })} required /></div>
            <div><label className="text-sm font-bold mb-1.5 block">كلمة المرور (ستُشفر تلقائياً)</label><Input type="password" placeholder="••••••••" value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} required /></div>
            <div className="flex gap-2 justify-end pt-2"><Button variant="ghost" type="button" onClick={() => setShow(false)}>إلغاء</Button><Button type="submit" disabled={adding}>{adding?"جاري الإضافة...":"إضافة"}</Button></div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <form onSubmit={saveEdit} className="relative bg-white rounded-[20px] p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-black text-lg">تعديل القائد</h3>
            <p className="text-xs text-slate-500">اترك كلمة المرور فارغة إذا لا تريد تغييرها</p>
            <div><label className="text-sm font-bold mb-1.5 block">الاسم</label><Input value={editForm.name} onChange={(e: any) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
            <div><label className="text-sm font-bold mb-1.5 block">البريد / اسم المستخدم</label><Input value={editForm.username} onChange={(e: any) => setEditForm({ ...editForm, username: e.target.value })} required /></div>
            <div><label className="text-sm font-bold mb-1.5 block">كلمة المرور الجديدة (اختياري)</label><Input type="password" placeholder="اتركه فارغاً لعدم التغيير" value={editForm.password} onChange={(e: any) => setEditForm({ ...editForm, password: e.target.value })} /></div>
            <div className="flex gap-2 justify-end pt-2"><Button variant="ghost" type="button" onClick={() => setEditing(null)}>إلغاء</Button><Button type="submit" disabled={saving}>{saving?"جاري الحفظ...":"حفظ التعديل"}</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
