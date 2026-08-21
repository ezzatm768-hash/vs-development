import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { callerId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await ctx.db.get(args.callerId);
    if (!caller) throw new Error("غير مصرح");
    return await ctx.db.query("evaluation_periods").collect();
  },
});

export const active = query({
  args: { callerId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await ctx.db.get(args.callerId);
    if (!caller) throw new Error("غير مصرح");
    return await ctx.db.query("evaluation_periods").withIndex("by_status", (q) => q.eq("status", "active")).first();
  },
});

export const create = mutation({
  args: { callerId: v.id("users"), name: v.string(), start_date: v.optional(v.string()), end_date: v.optional(v.string()), period_type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const caller = await ctx.db.get(args.callerId);
    if (!caller || caller.role !== "admin") throw new Error("Admin فقط");
    const id = await ctx.db.insert("evaluation_periods", {
      name: args.name,
      start_date: args.start_date,
      end_date: args.end_date,
      period_type: args.period_type || "monthly",
      status: "active",
      created_at: Date.now(),
    });
    // create draft evaluations for all active sales
    const salesList = await ctx.db.query("sales").collect();
    const activeSales = salesList.filter((s) => s.status === "active" || !s.status);
    for (const sale of activeSales) {
      const team = await ctx.db.get(sale.team_id);
      if (team?.team_leader_id) {
        await ctx.db.insert("evaluations", {
          sales_id: sale._id,
          team_leader_id: team.team_leader_id,
          evaluation_period: args.name,
          evaluation_period_id: id,
          status: "draft",
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    }
    // notify leaders
    const leaders = (await ctx.db.query("users").collect()).filter((u) => u.role === "team_leader");
    for (const l of leaders) {
      await ctx.db.insert("notifications", { user_id: l._id, message: `فترة تقييم جديدة بدأت: ${args.name}`, type: "info", read: 0, created_at: Date.now() });
    }
    return id;
  },
});

export const updateStatus = mutation({
  args: { callerId: v.id("users"), id: v.id("evaluation_periods"), status: v.string() },
  handler: async (ctx, args) => {
    const caller = await ctx.db.get(args.callerId);
    if (!caller || caller.role !== "admin") throw new Error("Admin فقط");
    await ctx.db.patch(args.id, { status: args.status });
    return args.id;
  },
});
