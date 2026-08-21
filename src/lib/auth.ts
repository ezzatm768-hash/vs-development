// Simple JWT auth helper for Next.js API routes + client
// Passwords are hashed with bcryptjs on server only
export type Role = "admin" | "team_leader";
export type UserPayload = { id: string; username: string; role: Role; name: string; team_id?: string };

const JWT_SECRET = process.env.JWT_SECRET || "vs-sales-system-secret-key-2026";

export function getAuthFromHeader(req: Request): UserPayload | null {
  try {
    const h = req.headers.get("authorization") || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return null;
    // lazy import to avoid edge issues
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function signToken(user: any) {
  const jwt = require("jsonwebtoken");
  return jwt.sign({ id: user.id || user._id, username: user.username, role: user.role, name: user.name, team_id: user.team_id }, JWT_SECRET, { expiresIn: "24h" });
}
