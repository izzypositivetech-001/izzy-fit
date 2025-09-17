import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createPlan = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    workoutPlan: v.object({
      schedule: v.array(v.string()),
      exercises: v.array(
        v.object({
          day: v.string(),
          routines: v.array(
            v.object({
              name: v.string(),
              sets: v.number(),
              reps: v.number(),
            })
          ),
        })
      ),
    }),
    dietPlan: v.object({
      dailyCalories: v.number(),
      meals: v.array(
        v.object({
          name: v.string(),
          foods: v.array(v.string()),
        })
      ),
    }),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    console.log("[createPlan] called with args:", {
      userId: args.userId,
      name: args.name,
      isActive: args.isActive,
      workoutPlanDays: args.workoutPlan?.exercises?.length ?? 0,
      dietMeals: args.dietPlan?.meals?.length ?? 0,
    });
    const activePlans = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    console.log("[createPlan] existing active plans:", activePlans.map((p) => p._id));

    for (const plan of activePlans) {
      await ctx.db.patch(plan._id, { isActive: false });
      console.log("[createPlan] deactivated plan:", plan._id);
    }

    try {
      const planId = await ctx.db.insert("plans", args);
      console.log("[createPlan] inserted planId:", planId);
      return planId;
    } catch (error) {
      console.error("[createPlan] insert failed:", error);
      throw error;
    }
  },
});

export const getUserPlans = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Prefer explicit userId if provided (e.g., from Clerk on the client),
    // otherwise fall back to the authenticated identity.
    let resolvedUserId = args.userId ?? null;

    if (!resolvedUserId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        // Gracefully return empty for unauthenticated queries instead of throwing
        console.warn("[getUserPlans] no identity and no userId provided; returning empty array");
        return [];
      }
      console.log("[getUserPlans] identity.subject:", identity.subject);
      resolvedUserId = identity.subject;
    }

    console.log("[getUserPlans] args.userId:", args.userId);
    console.log("[getUserPlans] resolvedUserId:", resolvedUserId);
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", resolvedUserId!))
      .order("desc")
      .collect();

    console.log("[getUserPlans] plans count:", plans.length);
    if (plans.length === 0) {
      // Diagnostic: sample recent userIds present in the table to detect mismatches
      const recent = await ctx.db.query("plans").order("desc").take(5);
      const sampleUserIds = Array.from(new Set(recent.map((p) => p.userId)));
      console.log("[getUserPlans] recent sample userIds:", sampleUserIds);
    }
    return plans;
  },
});

// Repair plans created with a placeholder userId by assigning them to the provided userId
export const repairPlaceholderPlans = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const placeholderUserId = "{{user_id}}";
    const placeholderPlans = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", placeholderUserId))
      .collect();

    for (const plan of placeholderPlans) {
      await ctx.db.patch(plan._id, { userId: args.userId });
    }

    return { repairedCount: placeholderPlans.length };
  },
});