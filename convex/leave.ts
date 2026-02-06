import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// CREATE Request
export const create = mutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    category: v.union(v.literal("leave"), v.literal("late")),
    type: v.string(),
    reason: v.string(),
    
    // Leave args
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    session: v.optional(v.union(v.literal("full"), v.literal("morning"), v.literal("afternoon"))),
    
    // Late args
    targetDate: v.optional(v.number()),
    targetTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let durationDays = 0;
    let minutesLate = 0;

    // Logic: Calculate Duration
    if (args.category === "leave" && args.startDate && args.endDate) {
      const diff = Math.abs(args.endDate - args.startDate);
      const rawDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      // TODO: Exclude weekends logic here if needed strictly on server
      durationDays = rawDays; 
      if (args.session !== "full") durationDays = 0.5;
    }

    // Logic: Calculate Late Minutes (Approx)
    if (args.category === "late" && args.targetTime) {
      // Mock calculation
      minutesLate = 30; 
    }

    const id = await ctx.db.insert("leave_requests", {
      userId: args.userId,
      userEmail: args.userEmail,
      userName: args.userName,
      category: args.category,
      type: args.type,
      reason: args.reason,
      status: "pending",
      
      startDate: args.startDate,
      endDate: args.endDate,
      durationDays,
      session: args.session,

      targetDate: args.targetDate,
      targetTime: args.targetTime,
      minutesLate,

      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

// LIST Requests (For Dashboard)
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leave_requests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// LIST All (For Admin)
export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("leave_requests")
      .order("desc")
      .collect();
  },
});
