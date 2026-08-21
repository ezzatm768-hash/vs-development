import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    password: v.string(), // bcrypt hash
    role: v.union(v.literal("admin"), v.literal("team_leader")),
    name: v.string(),
    team_id: v.optional(v.id("teams")),
    created_at: v.optional(v.number()),
  })
    .index("by_username", ["username"])
    .index("by_role", ["role"])
    .index("by_team", ["team_id"]),

  teams: defineTable({
    team_name: v.string(),
    team_leader_id: v.optional(v.id("users")),
    created_at: v.optional(v.number()),
  }).index("by_leader", ["team_leader_id"]),

  sales: defineTable({
    name: v.string(),
    team_id: v.id("teams"),
    phone: v.optional(v.string()),
    join_date: v.optional(v.string()),
    status: v.optional(v.string()), // active/inactive
    created_at: v.optional(v.number()),
  })
    .index("by_team", ["team_id"])
    .index("by_name", ["name"]),

  evaluation_periods: defineTable({
    name: v.string(),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    period_type: v.optional(v.string()), // monthly/quarterly
    status: v.optional(v.string()), // active/archived
    created_at: v.optional(v.number()),
  }).index("by_status", ["status"]),

  // الجدول الرئيسي المطلوب - evaluations
  evaluations: defineTable({
    sales_id: v.id("sales"),
    team_leader_id: v.id("users"),
    evaluation_period: v.optional(v.string()), // نص الفترة للتوافق مع المتطلب
    evaluation_period_id: v.optional(v.id("evaluation_periods")),
    // الحقول الكتابية (تم تحويلها من رقمية إلى نصية حسب طلب العميل)
    product_knowledge: v.optional(v.string()),
    communication: v.optional(v.string()),
    needs_discovery: v.optional(v.string()),
    sales_process: v.optional(v.string()),
    crm_discipline: v.optional(v.string()),
    follow_up_activity: v.optional(v.string()),
    // الحقول النصية
    strengths: v.optional(v.string()),
    weaknesses: v.optional(v.string()),
    main_problem: v.optional(v.string()),
    employee_status: v.optional(v.string()), // ممتاز/جيد/يحتاج تحسين...
    final_notes: v.optional(v.string()),
    status: v.string(), // draft | submitted | reviewed | returned
    created_at: v.number(),
    updated_at: v.number(),
    submitted_at: v.optional(v.number()),
    reviewed_at: v.optional(v.number()),
    admin_notes: v.optional(v.string()),
  })
    .index("by_sales", ["sales_id"])
    .index("by_leader", ["team_leader_id"])
    .index("by_period", ["evaluation_period_id"])
    .index("by_status", ["status"])
    .index("by_sales_period", ["sales_id", "evaluation_period_id"]),

  // للتوافق مع النظام القديم - reports يعيد توجيهه إلى evaluations
  reports: defineTable({
    sales_id: v.id("sales"),
    team_leader_id: v.id("users"),
    evaluation_period_id: v.id("evaluation_periods"),
    status: v.string(),
    created_at: v.optional(v.number()),
    submitted_at: v.optional(v.number()),
    reviewed_at: v.optional(v.number()),
    admin_notes: v.optional(v.string()),
  })
    .index("by_sales", ["sales_id"])
    .index("by_leader", ["team_leader_id"]),

  evaluation_fields: defineTable({
    field_name: v.string(),
    field_description: v.optional(v.string()),
    field_order: v.number(),
    active: v.number(),
    created_at: v.optional(v.number()),
  }).index("by_order", ["field_order"]),

  evaluation_answers: defineTable({
    report_id: v.id("reports"),
    field_id: v.id("evaluation_fields"),
    answer: v.string(),
  }).index("by_report", ["report_id"]),

  notifications: defineTable({
    user_id: v.id("users"),
    message: v.string(),
    type: v.optional(v.string()),
    read: v.number(),
    created_at: v.number(),
  }).index("by_user", ["user_id"]),
});
