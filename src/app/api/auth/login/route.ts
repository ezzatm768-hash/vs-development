import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "@/lib/serverDb";

const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

async function getUserFromConvex(username: string){
  if(!CONVEX_URL || CONVEX_URL.includes("127.0.0.1")) return null;
  try{
    const { ConvexHttpClient } = await import("convex/browser");
    const client = new ConvexHttpClient(CONVEX_URL);
    const user:any = await client.query("auth:getUserByUsername" as any, { username });
    return user;
  }catch{ return null; }
}

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: "البيانات مطلوبة" }, { status: 400 });

  // Try Convex first (persistent on Vercel), fallback to file DB
  let user:any = await getUserFromConvex(username);
  let isConvex = !!user;
  if(!user){
    const db = await getDB();
    const users = db.users;
    user = users.find((u: any) => u.username === username);
  }
  if (!user) return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });

  const uid = user._id || user.id;
  const tid = user.team_id;
  const token = jwt.sign({ id: uid, username: user.username, role: user.role, name: user.name, team_id: tid }, JWT_SECRET, { expiresIn: "24h" });
  return NextResponse.json({ token, user: { id: uid, username: user.username, role: user.role, name: user.name, team_id: tid } });
}
