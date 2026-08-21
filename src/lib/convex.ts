// Convex client helper - uses NEXT_PUBLIC_CONVEX_URL when deployed on https://www.convex.dev
// لو لم يتم ضبط المتغير، يعمل النظام عبر Next.js API Fallback (نفس الـ schema)
export const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export function getConvexClient() {
  if (!CONVEX_URL) return null;
  try {
    const { ConvexHttpClient } = require("convex/browser");
    return new ConvexHttpClient(CONVEX_URL);
  } catch {
    return null;
  }
}

// Schema documentation for convex.dev deployment:
// See /convex/schema.ts - يحتوي على:
// users, teams, sales, evaluation_periods, evaluations (مع كل الحقول المطلوبة), reports, notifications
// Password Hashing عبر bcryptjs قبل insert
// RBAC في كل query/mutation عبر callerId
