import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to check RBAC
async function getUser(ctx: any, userId: any) {
  if (!userId) throw new Error("غير مصرح");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("المستخدم غير موجود");
  return user;
}

export const list = query({
  args: {
    callerId: v.id("users"),
    team_leader_id: v.optional(v.id("users")),
    sales_id: v.optional(v.id("sales")),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await getUser(ctx, args.callerId);
    let evals = await ctx.db.query("evaluations").collect();

    // RBAC: Team Leader sees only his team
    if (caller.role === "team_leader") {
      evals = evals.filter((e) => e.team_leader_id === caller._id);
    } else if (args.team_leader_id) {
      evals = evals.filter((e) => e.team_leader_id === args.team_leader_id);
    }

    if (args.sales_id) evals = evals.filter((e) => e.sales_id === args.sales_id);
    if (args.status) evals = evals.filter((e) => e.status === args.status);

    // enrich with sales & period names
    const enriched = await Promise.all(
      evals.map(async (e) => {
        const sales = await ctx.db.get(e.sales_id);
        const leader = await ctx.db.get(e.team_leader_id);
        let periodName = e.evaluation_period || "";
        if (e.evaluation_period_id) {
          const p = await ctx.db.get(e.evaluation_period_id);
          periodName = p?.name || periodName;
        }
        return {
          ...e,
          sales_name: sales?.name || "",
          team_leader_name: leader?.name || "",
          period_name: periodName,
        };
      })
    );

    if (args.search) {
      const s = args.search.toLowerCase();
      return enriched.filter(
        (e) => e.sales_name.toLowerCase().includes(s) || e.team_leader_name.toLowerCase().includes(s)
      );
    }

    return enriched.sort((a, b) => b.created_at - a.created_at);
  },
});

export const getById = query({
  args: { callerId: v.id("users"), id: v.id("evaluations") },
  handler: async (ctx, args) => {
    const caller = await getUser(ctx, args.callerId);
    const ev = await ctx.db.get(args.id);
    if (!ev) throw new Error("التقييم غير موجود");
    if (caller.role === "team_leader" && ev.team_leader_id !== caller._id) {
      throw new Error("غير مصرح لك بالوصول لهذا التقييم");
    }
    const sales = await ctx.db.get(ev.sales_id);
    const leader = await ctx.db.get(ev.team_leader_id);
    let period = null;
    if (ev.evaluation_period_id) period = await ctx.db.get(ev.evaluation_period_id);
    return {
      ...ev,
      sales_name: sales?.name,
      sales_phone: sales?.phone,
      team_leader_name: leader?.name,
      period_name: period?.name || ev.evaluation_period,
      period,
      sales,
    };
  },
});

export const createOrUpdate = mutation({
  args: {
    callerId: v.id("users"),
    sales_id: v.id("sales"),
    evaluation_period: v.optional(v.string()),
    evaluation_period_id: v.optional(v.id("evaluation_periods")),
    product_knowledge: v.optional(v.string()),
    communication: v.optional(v.string()),
    needs_discovery: v.optional(v.string()),
    sales_process: v.optional(v.string()),
    crm_discipline: v.optional(v.string()),
    follow_up_activity: v.optional(v.string()),
    strengths: v.optional(v.string()),
    weaknesses: v.optional(v.string()),
    main_problem: v.optional(v.string()),
    employee_status: v.optional(v.string()),
    final_notes: v.optional(v.string()),
    status: v.string(), // draft | submitted
    existingId: v.optional(v.id("evaluations")),
  },
  handler: async (ctx, args) => {
    const caller = await getUser(ctx, args.callerId);
    if (caller.role !== "team_leader" && caller.role !== "admin") throw new Error("غير مصرح");

    // Verify sales belongs to caller's team if team_leader
    const sales = await ctx.db.get(args.sales_id);
    if (!sales) throw new Error("الموظف غير موجود");
    if (caller.role === "team_leader") {
      const team = await ctx.db.get(sales.team_id);
      if (!team || team.team_leader_id !== caller._id) throw new Error("هذا الموظف ليس ضمن فريقك");
    }

    const now = Date.now();

    // If existingId provided, update
    if (args.existingId) {
      const existing = await ctx.db.get(args.existingId);
      if (!existing) throw new Error("التقييم غير موجود");
      if (caller.role === "team_leader" && existing.team_leader_id !== caller._id)
        throw new Error("غير مصرح");

      await ctx.db.patch(args.existingId, {
        evaluation_period: args.evaluation_period,
        evaluation_period_id: args.evaluation_period_id,
        product_knowledge: args.product_knowledge,
        communication: args.communication,
        needs_discovery: args.needs_discovery,
        sales_process: args.sales_process,
        crm_discipline: args.crm_discipline,
        follow_up_activity: args.follow_up_activity,
        strengths: args.strengths,
        weaknesses: args.weaknesses,
        main_problem: args.main_problem,
        employee_status: args.employee_status,
        final_notes: args.final_notes,
        status: args.status,
        updated_at: now,
        submitted_at: args.status === "submitted" ? now : existing.submitted_at,
      });
      return args.existingId;
    }

    // Check duplicate sales+period => update instead of create
    if (args.evaluation_period_id) {
      const dup = await ctx.db
        .query("evaluations")
        .withIndex("by_sales_period", (q) => q.eq("sales_id", args.sales_id).eq("evaluation_period_id", args.evaluation_period_id!))
        .first();
      if (dup) {
        await ctx.db.patch(dup._id, {
          product_knowledge: args.product_knowledge,
          communication: args.communication,
          needs_discovery: args.needs_discovery,
          sales_process: args.sales_process,
          crm_discipline: args.crm_discipline,
          follow_up_activity: args.follow_up_activity,
          strengths: args.strengths,
          weaknesses: args.weaknesses,
          main_problem: args.main_problem,
          employee_status: args.employee_status,
          final_notes: args.final_notes,
          status: args.status,
          updated_at: now,
          submitted_at: args.status === "submitted" ? now : dup.submitted_at,
        });
        return dup._id;
      }
    }

    const id = await ctx.db.insert("evaluations", {
      sales_id: args.sales_id,
      team_leader_id: caller.role === "team_leader" ? caller._id : args.sales_id ? caller._id : caller._id, // admin can act but we store caller
      evaluation_period: args.evaluation_period,
      evaluation_period_id: args.evaluation_period_id,
      product_knowledge: args.product_knowledge,
      communication: args.communication,
      needs_discovery: args.needs_discovery,
      sales_process: args.sales_process,
      crm_discipline: args.crm_discipline,
      follow_up_activity: args.follow_up_activity,
      strengths: args.strengths,
      weaknesses: args.weaknesses,
      main_problem: args.main_problem,
      employee_status: args.employee_status,
      final_notes: args.final_notes,
      status: args.status,
      created_at: now,
      updated_at: now,
      submitted_at: args.status === "submitted" ? now : undefined,
    });

    // Notify admin (first admin)
    if (args.status === "submitted") {
      const admins = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).collect();
      for (const a of admins) {
        await ctx.db.insert("notifications", {
          user_id: a._id,
          message: `تقرير جديد تم إرساله من ${caller.name}`,
          type: "info",
          read: 0,
          created_at: now,
        });
      }
    }

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    callerId: v.id("users"),
    id: v.id("evaluations"),
    status: v.string(), // reviewed | returned
    admin_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await getUser(ctx, args.callerId);
    if (caller.role !== "admin") throw new Error("للأدمن فقط");
    const ev = await ctx.db.get(args.id);
    if (!ev) throw new Error("غير موجود");
    await ctx.db.patch(args.id, {
      status: args.status,
      admin_notes: args.admin_notes,
      updated_at: Date.now(),
      reviewed_at: args.status === "reviewed" ? Date.now() : undefined,
    });
    if (args.status === "returned") {
      await ctx.db.insert("notifications", {
        user_id: ev.team_leader_id,
        message: "تمت إعادة التقييم للمراجعة. يرجى التعديل وإعادة الإرسال.",
        type: "warning",
        read: 0,
        created_at: Date.now(),
      });
    }
    return args.id;
  },
});

export const employeeHistory = query({
  args: { callerId: v.id("users"), salesId: v.id("sales") },
  handler: async (ctx, args) => {
    const caller = await getUser(ctx, args.callerId);
    const sales = await ctx.db.get(args.salesId);
    if (!sales) throw new Error("الموظف غير موجود");
    if (caller.role === "team_leader") {
      const team = await ctx.db.get(sales.team_id);
      if (!team || team.team_leader_id !== caller._id) throw new Error("غير مصرح");
    }
    const evals = await ctx.db.query("evaluations").withIndex("by_sales", (q) => q.eq("sales_id", args.salesId)).collect();
    return evals.sort((a, b) => b.created_at - a.created_at);
  },
});
