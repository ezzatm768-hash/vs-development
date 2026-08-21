"use client";
export default function TopNav({ user, onMenu }: { user: any; onMenu?: () => void }) {
  return (
    <header className="h-[64px] bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 gap-4 sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenu} className="md:hidden w-9 h-9 rounded-xl border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition shrink-0">☰</button>
        <div className="hidden md:block text-right">
          <h2 className="font-black text-black text-[15px] leading-none truncate">مرحباً، {user?.name || "—"}</h2>
          <p className="text-[11px] text-neutral-500 mt-1">{user?.role === "admin" ? "مدير النظام" : "قائد فريق"}</p>
        </div>
        <div className="md:hidden font-black text-black text-sm truncate">VS DEVELOPMENT</div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          متصل
        </div>
        <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white font-black text-sm">
          {(user?.name || "U").slice(0, 1)}
        </div>
      </div>
    </header>
  );
}
