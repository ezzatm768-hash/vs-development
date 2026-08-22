"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, Badge, Input, Empty, Loading, Button } from "@/components/UI";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const token = () => localStorage.getItem("token") || "";

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    setUser(u);
    fetch("/api/sales", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.members || data.sales || [];
        setSales(arr);
        setFiltered(arr);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) setFiltered(sales);
    else setFiltered(sales.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.team_name || "").toLowerCase().includes(search.toLowerCase())));
  }, [search, sales]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">إدارة الموظفين</h1><p className="text-sm text-slate-500">{user?.role === "admin" ? "عرض جميع الموظفين بكل الفرق" : "موظفو فريقك"}</p></div>
        <Input placeholder="بحث..." value={search} onChange={(e: any) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Card>
        <CardHeader title={`الموظفون (${filtered.length})`} />
        {filtered.length === 0 ? <Empty title="لا يوجد موظفون" /> : (
          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm table-fixed" dir="rtl">
              <colgroup><col className="w-[8%]" /><col className="w-[28%]" /><col className="w-[32%]" /><col className="w-[32%]" /></colgroup>
              <thead className="bg-slate-50 text-slate-700"><tr><th className="p-3.5 text-center font-bold">#</th><th className="p-3.5 text-right font-bold">الاسم</th><th className="p-3.5 text-right font-bold">الفريق</th><th className="p-3.5 text-right font-bold">القائد</th></tr></thead>
              <tbody>
                {filtered.map((s: any, idx:number) => (
                  <tr key={s.id} className="border-t border-slate-200 hover:bg-slate-50 h-[52px] transition">
                    <td className="p-3.5 text-center font-bold text-slate-500">{idx+1}</td>
                    <td className="p-3.5 font-bold text-black text-right truncate">{s.name}</td>
                    <td className="p-3.5 text-right text-slate-700 truncate">{s.team_name || "—"}</td>
                    <td className="p-3.5 text-right text-slate-700 truncate">{s.team_leader_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
