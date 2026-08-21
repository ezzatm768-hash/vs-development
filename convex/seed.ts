import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").first();
    if (existing) return { message: "already seeded", count: (await ctx.db.query("users").collect()).length };
    // Pre-hashed passwords: me011012 and 00000
    // Hash for me011012 = $2a$10$Fy7INsenbFZmTcOvH8bybeqRw0y4Gj6fSx9m4i6PQx62kk1p4zrj. (from data/app.db.json)
    // For prod we hash dynamically? Use stored hash as is (bcrypt compare will work)
    const now = Date.now();
    const adminId = await ctx.db.insert("users", {
      username: "msms.ezzat@gmail.com",
      password: "$2a$10$Fy7INsenbFZmTcOvH8bybeqRw0y4Gj6fSx9m4i6PQx62kk1p4zrj.",
      role: "admin",
      name: "MS Ezzat",
      created_at: now,
    });
    const leaderId = await ctx.db.insert("users", {
      username: "mahmoud.elew@gmail.com",
      password: "$2a$10$L8u3j2r4n3YhbeSW/G8ZZuZFg0osZ9yOT5THnBg/dRni3cNxlxFey",
      role: "team_leader",
      name: "محمود",
      created_at: now,
    });
    const teamId = await ctx.db.insert("teams", {
      team_name: "فريق محمود",
      team_leader_id: leaderId,
      created_at: now,
    });
    await ctx.db.patch(leaderId, { team_id: teamId });
    // Nady - as added via UI
    const nadyId = await ctx.db.insert("users", {
      username: "nadavs@gmail.com",
      password: "$2a$10$Fy7INsenbFZmTcOvH8bybeqRw0y4Gj6fSx9m4i6PQx62kk1p4zrj.",
      role: "team_leader",
      name: "ندى",
      created_at: now,
    });
    const nadyTeamId = await ctx.db.insert("teams", {
      team_name: "فريق ندى",
      team_leader_id: nadyId,
      created_at: now,
    });
    await ctx.db.patch(nadyId, { team_id: nadyTeamId });

    const periodId = await ctx.db.insert("evaluation_periods", {
      name: "2026-08",
      start_date: "2026-07-31",
      end_date: "2026-08-30",
      period_type: "monthly",
      status: "active",
      created_at: now,
    });

    return { adminId, leaderId, nadyId, teamId, nadyTeamId, periodId };
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["users", "teams", "sales", "evaluation_periods", "evaluations", "notifications", "reports", "evaluation_fields", "evaluation_answers"] as const;
    for (const t of tables) {
      const docs = await ctx.db.query(t as any).collect();
      for (const d of docs) await ctx.db.delete(d._id);
    }
    return { cleared: true };
  },
});
