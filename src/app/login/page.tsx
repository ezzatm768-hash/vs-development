"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تسجيل الدخول");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col" dir="rtl">
      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[460px]">
          {/* Card */}
          <div className="bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_8px_40px_rgba(0,0,0,0.07)] border border-neutral-200 overflow-hidden animate-[fadeIn_0.4s_ease-out]">
            {/* Logo + Header inside card */}
            <div className="pt-8 sm:pt-10 pb-6 px-8 sm:px-10 flex flex-col items-center">
              <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] bg-black rounded-2xl flex items-center justify-center p-3 shadow-sm">
                <img src="/logo.svg" alt="VS Development" className="w-full h-full object-contain" />
              </div>
              <div className="mt-5 text-center">
                <h1 className="text-[11px] sm:text-xs font-black tracking-[0.32em] text-black">VS DEVELOPMENT</h1>
                <p className="text-[11px] text-neutral-500 mt-1 tracking-wide">نظام إدارة وتقييم فريق المبيعات</p>
              </div>
              <h2 className="text-[22px] sm:text-[24px] font-black text-black mt-8 tracking-tight">تسجيل الدخول</h2>
              <p className="text-[13px] text-neutral-500 mt-1.5">سجّل دخولك للوصول إلى لوحة التحكم</p>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="px-8 sm:px-10 pb-8 space-y-5">
              {/* Email */}
              <div>
                <label className="text-[13px] font-bold text-black mb-2 block">البريد الإلكتروني / اسم المستخدم</label>
                <div className="relative group">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-black transition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                  </span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="name@company.com"
                    required
                    dir="ltr"
                    className="w-full h-[48px] pr-11 pl-4 rounded-xl border border-neutral-200 bg-white text-[14px] text-black placeholder:text-neutral-400 outline-none focus:border-black focus:ring-4 focus:ring-black/[0.06] transition text-right"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[13px] font-bold text-black mb-2 block">كلمة المرور</label>
                <div className="relative group">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-black transition">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none"/></svg>
                  </span>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-[48px] pr-11 pl-11 rounded-xl border border-neutral-200 bg-white text-[14px] text-black placeholder:text-neutral-400 outline-none focus:border-black focus:ring-4 focus:ring-black/[0.06] transition text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition"
                    aria-label={showPass ? "إخفاء" : "إظهار"}
                  >
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9.88 9.88a3 3 0 104.24 4.24"/><path d="M10.73 5.08A10.94 10.94 0 0112 5c7 0 10 7 10 7a13.16 13.16 0 01-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 002 12s3 7 10 7a10.74 10.74 0 005.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-black text-white text-[13px] leading-5 px-4 py-3 flex items-start gap-2">
                  <span className="mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] rounded-xl bg-black hover:bg-neutral-800 active:bg-black text-white text-[14px] font-bold tracking-wide flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-4 focus-visible:ring-black/20"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري الدخول...
                  </>
                ) : (
                  "دخول"
                )}
              </button>


            </form>
          </div>

          {/* hint outside card */}
          <p className="text-center text-[11px] text-neutral-400 mt-6">نظام داخلي آمن — مصمم لشركات التطوير العقاري</p>
        </div>
      </div>

      {/* Footer - minimal */}
      <footer className="h-10 flex items-center justify-center border-t border-neutral-200 bg-white">
        <p className="text-[11px] text-neutral-600 tracking-wide">© 2026 VS DEVELOPMENT — جميع الحقوق محفوظة</p>
      </footer>

      <style>{`@keyframes fadeIn { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform: translateY(0);} }`}</style>
    </div>
  );
}
