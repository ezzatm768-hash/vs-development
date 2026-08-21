import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireAdmin(ctx: any, callerId: any) {
  const caller = await ctx.db.get(callerId);
  if (!caller || caller.role !== "admin") throw new Error("Admin فقط");
  return caller;
}

export const listTeamLeaders = query({
  args: { callerId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);
    const leaders = await ctx.db.query("users").withIndex("by_role", (q: any) => q.eq("role", "admin")).collect(); // placeholder
    const all = await ctx.db.query("users").collect();
    const teamLeaders = all.filter((u: any) => u.role === "team_leader");
    const enriched = await Promise.all(
      teamLeaders.map(async (u: any) => {
        const team = u.team_id ? await ctx.db.get(u.team_id) : null;
        // fallback find team by leader
        let teamDoc = team;
        if (!teamDoc) {
          const teams = await ctx.db.query("teams").collect();
          teamDoc = teams.find((t: any) => t.team_leader_id === u._id) || null;
        }
        const memberCount = teamDoc ? (await ctx.db.query("sales").withIndex("by_team", (q: any) => q.eq("team_id", teamDoc!._id)).collect()).length : 0;
        return { ...u, team_name: teamDoc?.team_name || null, team_id: teamDoc?._id || u.team_id || null, member_count: memberCount };
      })
    );
    return enriched;
  },
});

export const createTeamLeader = mutation({
  args: { callerId: v.id("users"), username: v.string(), password: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);
    const exists = await ctx.db.query("users").withIndex("by_username", (q: any) => q.eq("username", args.username)).unique();
    if (exists) throw new Error("اسم المستخدم موجود مسبقاً");
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      username: args.username,
      password: args.password, // already hashed by Next.js API
      role: "team_leader",
      name: args.name,
      created_at: now,
    });
    const teamId = await ctx.db.insert("teams", { team_name: `فريق ${args.name}`, team_leader_id: userId, created_at: now });
    await ctx.db.patch(userId, { team_id: teamId });
    return { userId, teamId };
  },
});

export const updateTeamLeader = mutation({
  args: { callerId: v.id("users"), id: v.id("users"), name: v.optional(v.string()), username: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);
    const patch: any = {};
    if (args.name) patch.name = args.name;
    if (args.username) patch.username = args.username;
    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const deleteTeamLeader = mutation({
  args: { callerId: v.id("users"), id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("غير موجود");
    // cascade delete sales + evaluations
    const teams = await ctx.db.query("teams").collect();
    const team = teams.find((t: any) => t.team_leader_id === args.id) || (user.team_id ? await ctx.db.get(user.team_id) : null);
    if (team) {
      const salesList = await ctx.db.query("sales").withIndex("by_team", (q: any) => q.eq("team_id", team._id)).collect();
      for (const s of salesList) {
        const evals = await ctx.db.query("evaluations").withIndex("by_sales", (q: any) => q.eq("sales_id", s._id)).collect();
        for (const e of evals) await ctx.db.delete(e._id);
        await ctx.db.delete(s._id);
      }
      await ctx.db.delete(team._id);
    }
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});

export const dashboardStats = query({
  args: { callerId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.callerId);
    const allUsers = await ctx.db.query("users").collect();
    const totalTeamLeaders = allUsers.filter((u: any) => u.role === "team_leader").length;
    const totalSales = (await ctx.db.query("sales").collect()).length;
    const allEvals = await ctx.db.query("evaluations").collect();
    const completedReports = allEvals.filter((e: any) => e.status === "reviewed").length;
    const pendingReports = allEvals.filter((e: any) => e.status === "draft").length;
    const submittedReports = allEvals.filter((e: any) => e.status === "submitted").length;
    const activeTeams = (await ctx.db.query("teams").collect()).length;

    // reports by leader
    const leaders = allUsers.filter((u: any) => u.role === "team_leader");
    const reportsByTeamLeader = await Promise.all(
      leaders.map(async (l: any) => {
        const mine = allEvals.filter((e: any) => e.team_leader_id === l._id);
        return {
          team_leader_name: l.name,
          completed: mine.filter((e: any) => e.status === "reviewed").length,
          pending: mine.filter((e: any) => e.status === "draft").length,
          submitted: mine.filter((e: any) => e.status === "submitted").length,
          returned: mine.filter((e: any) => e.status === "returned").length,
          total: mine.length,
        };
      })
    );

    return { totalTeamLeaders, totalSales, completedReports, pendingReports, submittedReports, activeTeams, reportsByTeamLeader };
  },
});
