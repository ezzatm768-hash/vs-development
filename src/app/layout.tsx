import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام تقييم المبيعات - VS Development",
  description: "نظام إدارة وتقييم فرق المبيعات",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased" style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
