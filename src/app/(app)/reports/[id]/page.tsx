"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, Button, Badge, Loading, Textarea, Select } from "@/components/UI";

export default function ReportDetail() {
  const params = useParams() as any;
  const id = params.id;
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusAction, setStatusAction] = useState("reviewed");

  const token = () => localStorage.getItem("token") || "";

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    setUser(u);
    fetch(`/api/evaluations/${id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then(async (d) => {
        setData(d);
        setAdminNotes(d.admin_notes || "");
        // ثانياً: لما الأدمن يدخل التقرير يسجل تلقائياً أنه تمت المراجعة له وللتيم ليدر
        if (d && !d.error && u?.role === "admin" && d.status === "submitted") {
          try {
            await fetch(`/api/evaluations/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify({ status: "reviewed", admin_notes: d.admin_notes || "" }) });
            // حدث البيانات محلياً ليظهر مقروء ✓
            setData((prev:any)=> prev ? { ...prev, status: "reviewed", reviewed_at: Date.now() } : prev);
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async () => {
    const res = await fetch(`/api/evaluations/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify({ status: statusAction, admin_notes: adminNotes }) });
    if (res.ok) { alert("تم التحديث"); location.reload(); } else { const e = await res.json(); alert(e.error || "فشل"); }
  };

  if (loading) return <Loading />;
  if (!data || data.error) return <div className="text-center py-12 text-red-600">{data?.error || "غير موجود أو غير مصرح"}</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 no-print">
        <Button variant="ghost" onClick={() => history.back()}>رجوع</Button>
        <div className="flex gap-2">
          <Button onClick={() => document.getElementById('report-full')?.scrollIntoView({ behavior:'smooth' })}>عرض التقرير بالكامل</Button>
          <Button variant="ghost" onClick={() => window.print()}>طباعة التقرير (A4)</Button>
        </div>
      </div>

      <Card id="report-full" className="print-card overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-sky-700 text-white p-6">
          <h1 className="text-xl font-black">تقرير تقييم الموظف</h1>
          <p className="text-white/80 text-sm mt-1">{data.evaluation_period} • {new Date(data.updated_at).toLocaleDateString("ar-EG")}</p>
        </div>

        <div className="p-6 grid md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-slate-500">الموظف</div><div className="font-bold text-base">{data.sales_name}</div><div className="text-xs text-slate-500">{data.sales_phone || ""}</div></div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-slate-500">قائد الفريق</div><div className="font-bold">{data.team_leader_name}</div></div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-slate-500">الحالة</div><div className="mt-1"><Badge color={data.status === "draft" ? "slate" : data.status === "submitted" ? "amber" : data.status === "reviewed" ? "emerald" : "red"}>{data.status}</Badge></div></div>
        </div>

        <div className="px-6">
          <h3 className="font-bold">التقييم الكتابي التفصيلي</h3>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            {[
              ["product_knowledge", "معرفة المنتج"],
              ["communication", "التواصل"],
              ["needs_discovery", "اكتشاف الاحتياجات"],
              ["sales_process", "عملية البيع"],
              ["crm_discipline", "انضباط CRM"],
              ["follow_up_activity", "المتابعة والنشاط"],
            ].map(([k, label]) => (
              <div key={k} className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="text-sm mt-1 min-h-[40px] whitespace-pre-wrap">{data[k] || "—"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-4 text-sm">
          <div><div className="font-bold">نقاط القوة</div><div className="mt-1 p-3 rounded-xl bg-emerald-50 border border-emerald-200 min-h-[60px]">{data.strengths || "—"}</div></div>
          <div><div className="font-bold">نقاط الضعف</div><div className="mt-1 p-3 rounded-xl bg-red-50 border border-red-200 min-h-[60px]">{data.weaknesses || "—"}</div></div>
          <div><div className="font-bold">المشكلة الأساسية</div><div className="mt-1 p-3 rounded-xl bg-amber-50 border border-amber-200 min-h-[60px]">{data.main_problem || "—"}</div></div>
          <div><div className="font-bold">حالة الموظف</div><div className="mt-1"><Badge color="indigo">{data.employee_status || "—"}</Badge></div><div className="font-bold mt-3">ملاحظات نهائية</div><div className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200">{data.final_notes || "—"}</div></div>
        </div>

        {data.admin_notes && <div className="mx-6 mb-6 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-sm"><div className="font-bold">ملاحظات الإدارة</div><div className="mt-1">{data.admin_notes}</div></div>}

        {/* تقرير كامل للطباعة + توقيع التيم ليدر في آخر الصفحة */}
        <div className="mx-6 mt-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <div className="font-bold text-black">ملاحظة الطباعة</div>
          <div className="mt-1">هذا التقرير يحتوي على التقييم الكتابي الكامل لكل المعايير وسيتم طباعته بالكامل مع التوقيع أدناه — مناسب لورق A4.</div>
        </div>

        <div className="mx-6 mt-8 mb-6 pt-6 border-t-2 border-slate-900 print:break-inside-avoid">
          <div className="text-center font-black text-black mb-6">التوقيعات والاعتماد</div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="text-center">
              <div className="font-bold text-black">توقيع التيم ليدر</div>
              <div className="mt-14 border-b-2 border-slate-800 h-px w-48 mx-auto"></div>
              <div className="text-sm font-bold text-black mt-2">{data.team_leader_name}</div>
              <div className="text-xs text-slate-500">التوقيع والختم</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-black">توقيع الإدارة</div>
              <div className="mt-14 border-b-2 border-slate-800 h-px w-48 mx-auto"></div>
              <div className="text-xs text-slate-500 mt-2" dir="ltr">{new Date().toLocaleDateString("en-GB")}</div>
              <div className="text-xs text-slate-500">التاريخ والختم</div>
            </div>
          </div>
          <div className="text-center text-[10px] text-slate-400 mt-8 border-t border-slate-200 pt-3">هذا التقرير رسمي — نسخة موقعة تحفظ في ملف الموظف — VS DEVELOPMENT — {data.evaluation_period}</div>
        </div>
      </Card>

      {user?.role === "admin" && data.status === "submitted" && (
        <Card className="no-print">
          <CardHeader title="إجراء الإدارة" desc="اعتماد أو إعادة التقييم" />
          <div className="p-4 space-y-3">
            <div><label className="text-sm font-medium">الحالة</label><Select value={statusAction} onChange={(e: any) => setStatusAction(e.target.value)} className="max-w-xs"><option value="reviewed">اعتماد (مكتمل)</option><option value="returned">إعادة للمراجعة</option></Select></div>
            <div><label className="text-sm font-medium">ملاحظات الإدارة</label><Textarea rows={3} value={adminNotes} onChange={(e: any) => setAdminNotes(e.target.value)} placeholder="اكتب ملاحظات..." /></div>
            <Button onClick={updateStatus}>تأكيد</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
