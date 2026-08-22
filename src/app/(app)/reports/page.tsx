"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Button, Badge, Input, Select, Empty, Loading } from "@/components/UI";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [user, setUser] = useState<any>(null);

  const token = () => localStorage.getItem("token") || "";

  const load = async () => {
    setLoading(true);
    const u = JSON.parse(localStorage.getItem("user") || "null");
    setUser(u);
    const res = await fetch("/api/evaluations", { headers: { Authorization: `Bearer ${token()}` } });
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data.evaluations || [];
    setReports(arr);
    setFiltered(arr);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    let out = reports;
    if (search) out = out.filter((r: any) => (r.sales_name || r.sales_id || "").toLowerCase().includes(search.toLowerCase()) || (r.evaluation_period || "").toLowerCase().includes(search.toLowerCase()));
    if (status) out = out.filter((r: any) => r.status === status);
    setFiltered(out);
  }, [search, status, reports]);

  const exportCSV = () => {
    const header = ["الموظف", "الفترة", "المعرفة", "التواصل", "اكتشاف الاحتياجات", "عملية البيع", "CRM", "المتابعة", "الحالة"];
    const rows = filtered.map((r: any) => [r.sales_name || r.sales_id, r.evaluation_period, r.product_knowledge, r.communication, r.needs_discovery, r.sales_process, r.crm_discipline, r.follow_up_activity, r.status]);
    const csv = [header, ...rows].map((row) => row.map((v: any) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "reports.csv"; a.click();
  };

  if (loading) return <Loading />;

  const grouped = (() => {
    if (user?.role !== "admin") return null;
    const map = new Map<string, { leader: string; team: string; reports: any[] }>();
    for (const r of filtered) {
      const key = r.team_leader_name || r.team_name || "غير معروف";
      if (!map.has(key)) map.set(key, { leader: key, team: r.team_name || r.team_leader_name || "—", reports: [] });
      map.get(key)!.reports.push(r);
    }
    return Array.from(map.values());
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">التقارير</h1>
          <p className="text-sm text-neutral-500">عرض وتصدير وطباعة التقارير — {filtered.length} تقرير {user?.role==="admin" && grouped ? `• ${grouped.length} قائد` : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={exportCSV} className="border border-neutral-200">تصدير Excel/CSV</Button>
          <Button variant="ghost" onClick={() => window.print()} className="no-print border border-neutral-200">طباعة</Button>
        </div>
      </div>

      <Card>
        <div className="p-4 flex flex-wrap gap-3 bg-neutral-50/50">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">⌕</span>
            <Input placeholder="ابحث بالاسم أو الفترة..." value={search} onChange={(e: any) => setSearch(e.target.value)} className="pr-9 bg-white border-neutral-200 placeholder:text-neutral-500 text-[14px] font-medium h-[42px]" />
          </div>
          <Select value={status} onChange={(e: any) => setStatus(e.target.value)} className="max-w-[180px] h-[42px] bg-white">
            <option value="">كل الحالات</option>
            <option value="draft">مسودة</option>
            <option value="submitted">مرسل</option>
            <option value="reviewed">مكتمل</option>
            <option value="returned">مُعاد</option>
          </Select>
        </div>

        {filtered.length === 0 ? <Empty title="لا توجد تقارير" /> : user?.role==="admin" && grouped ? (
          <div className="p-4 space-y-6">
            {grouped.map((g:any)=> (
              <div key={g.leader} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex items-center justify-between">
                  <div>
                    <div className="font-black text-[15px]">{g.leader}</div>
                    <div className="text-xs text-slate-300 mt-1">{g.team} • {g.reports.length} تقرير</div>
                  </div>
                  <Badge color="sky">{g.reports.length} تقرير</Badge>
                </div>
                <div className="overflow-auto">
                  <table className="w-full table-fixed" dir="rtl">
                    <colgroup><col className="w-[7%]" /><col className="w-[24%]" /><col className="w-[18%]" /><col className="w-[18%]" /><col className="w-[16%]" /><col className="w-[17%]" /></colgroup>
                    <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3 text-center">#</th><th className="p-3 text-right">الموظف</th><th className="p-3 text-center">الفترة</th><th className="p-3 text-center">الحالة</th><th className="p-3 text-center">آخر تحديث</th><th className="p-3 text-center no-print">إجراءات</th></tr></thead>
                    <tbody>
                      {g.reports.map((r:any, idx:number)=>{
                        const isRead = r.status==="reviewed";
                        const isPending = r.status==="submitted";
                        return (
                          <tr key={r.id} className={`border-t border-slate-200 h-[52px] transition ${isRead ? "bg-emerald-50/40 hover:bg-emerald-50" : isPending ? "bg-amber-50/40 hover:bg-amber-50" : "hover:bg-slate-50"}`}>
                            <td className="p-3 text-center font-bold text-slate-500">{idx+1}</td>
                            <td className="p-3 font-bold text-black text-right truncate">{r.sales_name || r.sales_id}</td>
                            <td className="p-3 text-center text-sm" dir="ltr">{r.evaluation_period}</td>
                            <td className="p-3 text-center">
                              {isRead ? <Badge color="emerald">مقروء ✓</Badge> : isPending ? <Badge color="amber">قيد المراجعة</Badge> : <StatusBadge status={r.status} />}
                            </td>
                            <td className="p-3 text-center text-xs font-medium" dir="ltr">{new Date(r.updated_at).toLocaleDateString("en-GB")}</td>
                            <td className="p-3 text-center no-print">
                              <div className="flex gap-1.5 justify-center items-center">
                                <Link href={`/reports/${r.id}`} className={`px-4 py-1.5 rounded-xl text-xs font-bold min-w-[64px] text-center transition ${isRead ? "bg-emerald-600 hover:bg-emerald-700 text-white" : isPending ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-900 hover:bg-black text-white"}`}>عرض</Link>
                                {isPending && <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">بانتظار المراجعة</span>}
                                {isRead && <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">تمت القراءة</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full table-fixed" dir="rtl">
              <colgroup>
                <col className="w-[7%]" />
                <col className="w-[22%]" />
                <col className="w-[16%]" />
                <col className="w-[15%]" />
                <col className="w-[16%]" />
                <col className="w-[24%]" />
              </colgroup>
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="p-3.5 text-center font-bold text-[13px]">#</th>
                  <th className="p-3.5 text-right font-bold text-[13px]">الموظف</th>
                  <th className="p-3.5 text-center font-bold text-[13px]">الفترة</th>
                  <th className="p-3.5 text-center font-bold text-[13px]">الحالة</th>
                  <th className="p-3.5 text-center font-bold text-[13px]">آخر تحديث</th>
                  <th className="p-3.5 text-center font-bold text-[13px] no-print">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any, idx:number) => {
                  const isRead = r.status==="reviewed";
                  const isPending = r.status==="submitted";
                  return (
                    <tr key={r.id} className={`border-t border-neutral-200 h-[56px] transition ${isRead ? "bg-emerald-50/30" : isPending ? "bg-amber-50/20" : "hover:bg-neutral-50"}`}>
                      <td className="p-3.5 text-center font-bold text-neutral-500 text-[13px]">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-black text-[14px] text-right truncate">{r.sales_name || r.sales_id}</td>
                      <td className="p-3.5 text-center font-medium text-black text-[13px]" dir="ltr">{r.evaluation_period}</td>
                      <td className="p-3.5 text-center">{isRead ? <Badge color="emerald">مقروء ✓</Badge> : isPending ? <Badge color="amber">قيد المراجعة</Badge> : <StatusBadge status={r.status} />}</td>
                      <td className="p-3.5 text-center font-medium text-black text-[13px]" dir="ltr">{new Date(r.updated_at).toLocaleDateString("en-GB")}</td>
                      <td className="p-3.5 text-center no-print">
                        <div className="flex gap-1.5 justify-center items-center">
                          <Link href={`/reports/${r.id}`} className={`px-4 py-1.5 rounded-xl text-xs font-bold min-w-[64px] text-center transition ${isRead ? "bg-emerald-600 hover:bg-emerald-700 text-white" : isPending ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-[#0F172A] hover:bg-black text-white"}`}>عرض</Link>
                          {isPending && <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">بانتظار المراجعة</span>}
                          {isRead && <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">تمت القراءة</span>}
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
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  const map: any = { draft: ["مسودة", "slate"], submitted: ["مرسل", "amber"], reviewed: ["مكتمل", "emerald"], returned: ["مُعاد", "red"] };
  const [label, color] = map[status] || [status, "slate"];
  return <Badge color={color as any}>{label}</Badge>;
}
