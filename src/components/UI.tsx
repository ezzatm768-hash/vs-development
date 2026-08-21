"use client";
import React from "react";

export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={`bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ${className}`}>{children}</div>;
}
export function CardHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="p-5 flex items-start justify-between gap-4 border-b border-slate-100">
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        {desc && <p className="text-sm text-slate-500 mt-1">{desc}</p>}
      </div>
      {action}
    </div>
  );
}
export function Button({ children, variant = "primary", size = "md", className = "", ...props }: any) {
  const variants: any = {
    primary: "bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-sm",
    secondary: "bg-slate-900 hover:bg-black text-white",
    ghost: "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700",
    danger: "bg-white hover:bg-red-50 border border-slate-200 text-red-600",
  };
  const sizes: any = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3" };
  return (
    <button className={`rounded-xl font-medium transition disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: string }) {
  const map: any = {
    slate: "bg-slate-100 text-slate-700 border border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    sky: "bg-sky-50 text-sky-700 border border-sky-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    black: "bg-slate-900 text-white",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${map[color]}`}>{children}</span>;
}
export function Input(props: any) {
  return <input {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition ${props.className || ""}`} />;
}
export function Select(props: any) {
  return <select {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-slate-900/5 ${props.className || ""}`} />;
}
export function Textarea(props: any) {
  return <textarea {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-slate-900/5 ${props.className || ""}`} />;
}
export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-bold text-slate-900 mb-1.5 block">{children}</label>;
}
export function Empty({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">—</div>
      <div className="font-bold mt-3 text-slate-900">{title}</div>
      {desc && <div className="text-sm text-slate-500 mt-1">{desc}</div>}
    </div>
  );
}
export function Loading() {
  return (
    <div className="py-10 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      <div className="text-sm text-slate-500">جاري التحميل...</div>
    </div>
  );
}
