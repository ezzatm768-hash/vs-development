import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUser(ctx: any, userId: any) {
  const u = await ctx.db.get(userId);
  if (!u) throw new Error("غير مصرح");
  return u;
}

export const list = query({
  args: { callerId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await getUser(ctx, args.callerId);
    let sales = await ctx.db.query("sales").collect();
    if (caller.role === "team_leader") {
      // only his team
      const teamId = caller.team_id;
      let team = teamId ? await ctx.db.get(teamId) : null;
      if (!team) {
        const teams = await ctx.db.query("teams").collect();
        team = teams.find((t) => t.team_leader_id === caller._id) || null;
      }
      if (!team) return [];
      sales = sales.filter((s) => s.team_id === team._id);
    }
    const enriched = await Promise.all(
      sales.map(async (s) => {
        const team = await ctx.db.get(s.team_id);
        let leaderName = "";
        if (team?.team_leader_id) {
          const leader = await ctx.db.get(team.team_leader_id);
          leaderName = leader?.name || "";
        }
        return { ...s, team_name: team?.team_name || "", team_leader_name: leaderName };
      })
    );
    return enriched.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  },
});

export const myTeam = query({
  args: { callerId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await getUser(ctx, args.callerId);
    if (caller.role !== "team_leader") throw new Error("للقادة فقط");
    let team = caller.team_id ? await ctx.db.get(caller.team_id) : null;
    if (!team) {
      const teams = await ctx.db.query("teams").collect();
      team = teams.find((t) => t.team_leader_id === caller._id) || null;
    }
    if (!team) return { team: null, members: [] };
    const members = await ctx.db.query("sales").withIndex("by_team", (q) => q.eq("team_id", team!._id as any)).collect();
    return { team, members: members.sort((a, b) => a.name.localeCompare(b.name, "ar")) };
  },
});

export const create = mutation({
  args: { callerId: v.id("users"), name: v.string(), phone: v.optional(v.string()), join_date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const caller = await getUser(ctx, args.callerId);
    let teamId: any = caller.team_id;
    if (!teamId) {
      const teams = await ctx.db.query("teams").collect();
      const t = teams.find((x) => x.team_leader_id === caller._id);
      if (!t) throw new Error("لا يوجد فريق");
      teamId = t._id;
    }
    if (!args.name) throw new Error("الاسم مطلوب");
    const id = await ctx.db.insert("sales", {
      name: args.name,
      team_id: teamId,
      phone: args.phone || "",
      join_date: args.join_date || new Date().toISOString().split("T")[0],
      status: "active",
      created_at: Date.now(),
    });
    // auto-create draft evaluation for active period
    const activePeriod = await ctx.db.query("evaluation_periods").withIndex("by_status", (q) => q.eq("status", "active")).first();
    if (activePeriod) {
      await ctx.db.insert("evaluations", {
        sales_id: id,
        team_leader_id: caller._id,
        evaluation_period: activePeriod.name,
        evaluation_period_id: activePeriod._id,
        status: "draft",
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    }
    return id;
  },
});

export const update = mutation({
  args: { callerId: v.id("users"), id: v.id("sales"), name: v.optional(v.string()), phone: v.optional(v.string()), join_date: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const caller = await getUser(ctx, args.callerId);
    const sales = await ctx.db.get(args.id);
    if (!sales) throw new Error("غير موجود");
    if (caller.role === "team_leader") {
      let team = caller.team_id ? await ctx.db.get(caller.team_id) : null;
      if (!team) {
        const teams = await ctx.db.query("teams").collect();
        team = teams.find((t) => t.team_leader_id === caller._id) || null;
      }
      if (!team || sales.team_id !== team._id) throw new Error("ليس ضمن فريقك");
    }
    const patch: any = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.join_date !== undefined) patch.join_date = args.join_date;
    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const remove = mutation({
  args: { callerId: v.id("users"), id: v.id("sales") },
  handler: async (ctx, args) => {
    const caller = await getUser(ctx, args.callerId);
    const sales = await ctx.db.get(args.id);
    if (!sales) throw new Error("غير موجود");
    if (caller.role === "team_leader") {
      let team = caller.team_id ? await ctx.db.get(caller.team_id) : null;
      if (!team) {
        const teams = await ctx.db.query("teams").collect();
        team = teams.find((t) => t.team_leader_id === caller._id) || null;
      }
      if (!team || sales.team_id !== team._id) throw new Error("ليس ضمن فريقك");
    }
    const evals = await ctx.db.query("evaluations").withIndex("by_sales", (q) => q.eq("sales_id", args.id)).collect();
    for (const e of evals) await ctx.db.delete(e._id);
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});
