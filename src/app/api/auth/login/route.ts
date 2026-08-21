import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "@/lib/serverDb";

const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: "البيانات مطلوبة" }, { status: 400 });
  const db = await getDB();
  const users = db.users;
  const user = users.find((u: any) => u.username === username);
  if (!user) return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name, team_id: user.team_id }, JWT_SECRET, { expiresIn: "24h" });
  return NextResponse.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name, team_id: user.team_id } });
}
