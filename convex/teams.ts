import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { callerId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await ctx.db.get(args.callerId);
    if (!caller || caller.role !== "admin") throw new Error("Admin فقط");
    const teams = await ctx.db.query("teams").collect();
    const enriched = await Promise.all(
      teams.map(async (t) => {
        const leader = t.team_leader_id ? await ctx.db.get(t.team_leader_id) : null;
        const count = (await ctx.db.query("sales").withIndex("by_team", (q) => q.eq("team_id", t._id)).collect()).length;
        return { ...t, leader_name: leader?.name || "", member_count: count };
      })
    );
    return enriched;
  },
});

export const dashboard = query({
  args: { callerId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await ctx.db.get(args.callerId);
    if (!caller) throw new Error("غير مصرح");
    if (caller.role === "team_leader") {
      let team = caller.team_id ? await ctx.db.get(caller.team_id) : null;
      if (!team) {
        const teams = await ctx.db.query("teams").collect();
        team = teams.find((t) => t.team_leader_id === caller._id) || null;
      }
      if (!team) return { team: null, members: [], stats: {}, activePeriod: null, reports: [] };
      const members = await ctx.db.query("sales").withIndex("by_team", (q) => q.eq("team_id", team!._id as any)).collect();
      const activePeriod = await ctx.db.query("evaluation_periods").withIndex("by_status", (q) => q.eq("status", "active")).first();
      let stats = { totalMembers: members.length, requiredReports: 0, completedReports: 0, pendingReports: 0, submittedReports: 0 };
      let reports: any[] = [];
      if (activePeriod) {
        const allEvals = await ctx.db.query("evaluations").collect();
        const mine = allEvals.filter((e) => e.team_leader_id === caller._id && e.evaluation_period_id === activePeriod._id);
        stats.requiredReports = members.length;
        stats.completedReports = mine.filter((e) => e.status === "reviewed").length;
        stats.submittedReports = mine.filter((e) => e.status === "submitted").length;
        stats.pendingReports = stats.requiredReports - stats.completedReports - stats.submittedReports;
        if (stats.pendingReports < 0) stats.pendingReports = 0;
        reports = mine;
      } else {
        reports = await ctx.db.query("evaluations").withIndex("by_leader", (q) => q.eq("team_leader_id", caller._id)).collect();
      }
      // enrich reports with sales names
      const enriched = await Promise.all(
        reports.map(async (r) => {
          const s = await ctx.db.get(r.sales_id);
          return { ...r, sales_name: s?.name || "" };
        })
      );
      return { team, members, stats, activePeriod: activePeriod || null, reports: enriched, recentReports: enriched.slice(0, 5) };
    }
    // admin fallback
    return { team: null, members: [], stats: {}, activePeriod: null, reports: [] };
  },
});
