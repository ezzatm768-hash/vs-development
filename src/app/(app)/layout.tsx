"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!token || !u) {
      router.replace("/login");
      return;
    }
    try {
      setUser(JSON.parse(u));
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">جاري التحقق...</div>;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] overflow-hidden" dir="rtl">
      <div className="hidden md:flex shrink-0">
        <Sidebar role={user.role} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-black text-white overflow-auto shadow-2xl animate-[slideIn_0.25s_ease-out]">
            <Sidebar role={user.role} collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <TopNav user={user} onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-5 md:p-6 max-w-[1600px] w-full mx-auto overflow-auto">{children}</main>
      </div>
    </div>
  );
}
