import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper: verify token is just a userId passed from client after login
// In production use Convex Auth or JWT verification server-side.
// Passwords are HASHEed with bcryptjs on client/server before storage.

export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (!user) throw new Error("بيانات الدخول غير صحيحة");
    // password comparison will be done client-side via API route that uses bcrypt,
    // here we just return user for token generation fallback.
    // Real check is in Next.js API route /api/auth
    return { id: user._id, username: user.username, role: user.role, name: user.name, team_id: user.team_id };
  },
});

export const getMe = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return { id: user._id, username: user.username, role: user.role, name: user.name, team_id: user.team_id, created_at: user.created_at };
  },
});

export const seedAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").first();
    if (existing) return { message: "already seeded" };
    // This is a placeholder; real hashing done via Next.js seed route
    return { message: "seed via API route with hashed passwords" };
  },
});
