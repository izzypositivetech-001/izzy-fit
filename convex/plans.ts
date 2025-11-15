import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createPlan = mutation({
  args: {
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
    // Extract the real Clerk user ID from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized - no authenticated user");
    }
    
    const userId = identity.subject; // This is the real Clerk user ID
    console.log("[createPlan] Creating plan for user:", userId);

    const activePlans = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    console.log("[createPlan] existing active plans:", activePlans.map((p) => p._id));

    for (const plan of activePlans) {
      await ctx.db.patch(plan._id, { isActive: false });
      console.log("[createPlan] deactivated plan:", plan._id);
    }

    try {
      const planId = await ctx.db.insert("plans", {
        ...args,
        userId, // Use the real Clerk user ID
      });
      console.log("[createPlan] inserted planId:", planId);
      console.log("[createPlan] Created plan:", planId, "for user:", userId);
      return planId;
    } catch (error) {
      console.error("[createPlan] insert failed:", error);
      throw error;
    }
  },
});

export const getUserPlans = query({
  args: {}, // No args needed - we get user from auth context
  handler: async (ctx) => {
    // Get the authenticated user's ID
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty array for unauthenticated users
    }
    
    const userId = identity.subject;
    console.log("[getUserPlans] Fetching plans for user:", userId);

    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    console.log("[getUserPlans] Found", plans.length, "plans for user:", userId);
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