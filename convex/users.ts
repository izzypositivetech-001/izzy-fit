import { mutation, query } from "./_generated/server";
import { v } from "convex/values";



export const syncUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("Syncing user with args:", args);
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      console.log("Updating existing user:", args.clerkId);
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        image: args.image,
        clerkId: args.clerkId,
      });
      return existingUser._id;
    }

    console.log("Creating new user:", args.clerkId);
    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      clerkId: args.clerkId,
    });
  },
});

export const updateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!existingUser) return;

    return await ctx.db.patch(existingUser._id, args);
  },
});   

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user ?? null;
  },
});

export const handleClerkWebhook = mutation({
  args: { payload: v.any() },
  handler: async (ctx, args) => {
    const { data, type } = args.payload as any;
    if (!data || !type) return;

    if (type === "user.created" || type === "user.updated") {
      const clerkId: string | undefined = data.id;
      const email: string = data.email_addresses?.[0]?.email_address || "";
      const name: string = `${data.first_name || ""} ${data.last_name || ""}`.trim();
      const image: string | undefined = data.image_url || undefined;

      if (!clerkId) return;

      const existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { name, email, image });
        return existing._id;
      }

      return await ctx.db.insert("users", {
        clerkId,
        email,
        name: name || "Unknown User",
        image,
        createdAt: Date.now(),
      });
    }
  },
});