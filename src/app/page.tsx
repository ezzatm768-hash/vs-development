"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) router.replace("/dashboard");
    else router.replace("/login");
  }, [router]);
  return <div className="flex items-center justify-center min-h-screen text-slate-500">جاري التوجيه...</div>;
}
