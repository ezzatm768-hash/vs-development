import { NextResponse } from "next/server";
export async function GET(){
  return NextResponse.json({
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || null,
    CONVEX_URL: process.env.CONVEX_URL || null,
    VERCEL: process.env.VERCEL || null,
    NODE_ENV: process.env.NODE_ENV || null
  });
}
