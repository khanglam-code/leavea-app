import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// CREATE - Create a new team
export const create = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    lead: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      displayName: args.displayName,
      description: args.description,
      projectId: args.projectId,
      lead: args.lead,
      createdAt: Date.now(),
    });
    return teamId;
  },
});

// READ - List all teams
export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    if (args.projectId) {
      return await ctx.db
        .query("teams")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
    }
    return await ctx.db.query("teams").collect();
  },
});

// READ - Get team by ID
export const get = query({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// READ - Get team by name
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teams")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// READ - Get team with members
export const getWithMembers = query({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.id);
    if (!team) return null;

    const members = await ctx.db
      .query("agents")
      .withIndex("by_team", (q) => q.eq("teamId", args.id))
      .collect();

    const lead = team.lead ? await ctx.db.get(team.lead) : null;

    return {
      ...team,
      members,
      leadAgent: lead,
    };
  },
});

// UPDATE - Update team details
export const update = mutation({
  args: {
    id: v.id("teams"),
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    description: v.optional(v.string()),
    lead: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// UPDATE - Add agent to team
export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, {
      teamId: args.teamId,
    });
  },
});

// UPDATE - Remove agent from team
export const removeMember = mutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, {
      teamId: undefined,
    });
  },
});

// DELETE - Delete team
export const remove = mutation({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    // First, remove team reference from all agents
    const members = await ctx.db
      .query("agents")
      .withIndex("by_team", (q) => q.eq("teamId", args.id))
      .collect();

    for (const member of members) {
      await ctx.db.patch(member._id, { teamId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});
