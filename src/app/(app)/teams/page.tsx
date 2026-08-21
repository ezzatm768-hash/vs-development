"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, Badge, Empty, Loading } from "@/components/UI";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    fetch("/api/teams", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setTeams(Array.isArray(d) ? d : d.teams || []))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Loading />;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">إدارة الفرق</h1>
      <Card>
        <CardHeader title={`الفرق (${teams.length})`} />
        {teams.length === 0 ? <Empty title="لا توجد فرق" /> : (
          <div className="grid md:grid-cols-2 gap-4 p-4">
            {teams.map((t: any) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="font-bold text-lg">{t.team_name}</div>
                <div className="text-sm text-slate-500">القائد: {t.leader_name || t.team_leader_id || "—"}</div>
                <div className="mt-2"><Badge color="sky">{t.member_count ?? 0} عضو</Badge></div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
