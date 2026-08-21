"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const adminLinks = [
  { href: "/dashboard", label: "لوحة التحكم", icon: "◧" },
  { href: "/teams", label: "إدارة الفرق", icon: "⬢" },
  { href: "/team-leaders", label: "إدارة Team Leaders", icon: "⬣" },
  { href: "/sales", label: "إدارة الموظفين", icon: "⬔" },
  { href: "/evaluations", label: "التقييمات", icon: "✎" },
  { href: "/reports", label: "التقارير", icon: "▤" },
  { href: "/periods", label: "فترات التقييم", icon: "▦" },
];

const leaderLinks = [
  { href: "/dashboard", label: "لوحة التحكم", icon: "◧" },
  { href: "/team", label: "فريقي", icon: "⬢" },
  { href: "/evaluations", label: "التقييمات", icon: "✎" },
  { href: "/reports", label: "تقاريري", icon: "▤" },
];

export default function Sidebar({ role, collapsed, onToggle }: { role: string; collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "admin" ? adminLinks : leaderLinks;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside className={`${collapsed ? "w-20" : "w-72"} flex flex-col bg-[#0F172A] text-white transition-all duration-300 shrink-0`}>
      <div className="h-20 flex items-center justify-between px-4 border-b border-slate-700/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="VS Development" className="w-10 h-10 object-contain bg-white rounded-xl p-1.5 shadow-sm" />
            <div>
              <div className="font-black tracking-widest text-sm leading-none">VS DEVELOPMENT</div>
              <div className="text-[10px] tracking-[0.2em] text-slate-400 mt-1">نظام التقييم</div>
            </div>
          </div>
        )}
        <button onClick={onToggle} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-sm transition">
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${active ? "bg-white text-[#0F172A] font-bold shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <span className="text-sm">{l.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{l.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700/50">
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-slate-800 hover:bg-white hover:text-[#0F172A] border border-slate-700 transition">
          <span>↪</span>
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
