/**
 * Agent Skills System (AGT-129)
 * Per ADR-005: Permission Levels and Human Oversight
 *
 * Tracks agent capabilities, autonomy levels, and skill progression.
 * Autonomy levels: 1=Intern, 2=Specialist, 3=Lead
 */
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Autonomy level names
const AUTONOMY_LEVELS = {
  1: "Intern",
  2: "Specialist",
  3: "Lead",
} as const;

/**
 * Get skills for a specific agent
 */
export const getByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const skills = await ctx.db
      .query("agentSkills")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!skills) return null;

    return {
      ...skills,
      autonomyLevelName: AUTONOMY_LEVELS[skills.autonomyLevel],
    };
  },
});

/**
 * List all agent skills (for dashboard)
 */
export const list = query({
  handler: async (ctx) => {
    const allSkills = await ctx.db.query("agentSkills").collect();
    const agents = await ctx.db.query("agents").collect();

    const agentMap = new Map(agents.map((a) => [a._id, a]));

    return allSkills.map((skills) => ({
      ...skills,
      autonomyLevelName: AUTONOMY_LEVELS[skills.autonomyLevel],
      agent: agentMap.get(skills.agentId),
    }));
  },
});

/**
 * Initialize skills for an agent (run once per agent)
 */
export const initialize = mutation({
  args: {
    agentId: v.id("agents"),
    autonomyLevel: v.union(v.literal(1), v.literal(2), v.literal(3)),
    territory: v.array(v.string()),
    initialSkills: v.optional(
      v.array(
        v.object({
          name: v.string(),
          proficiency: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if already exists
    const existing = await ctx.db
      .query("agentSkills")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      throw new Error("Skills already initialized for this agent");
    }

    // Default permissions based on autonomy level
    const permissions = {
      canPush: false, // Always requires approval per ADR-005
      canMerge: args.autonomyLevel >= 3,
      canDeploy: false, // Always requires approval
      canEditSchema: args.autonomyLevel >= 3,
      canApproveOthers: args.autonomyLevel >= 3,
    };

    // Build skills array
    const skills = (args.initialSkills ?? []).map((s) => ({
      name: s.name,
      proficiency: Math.min(100, Math.max(0, s.proficiency)),
      verified: false,
      lastUsed: now,
    }));

    return await ctx.db.insert("agentSkills", {
      agentId: args.agentId,
      autonomyLevel: args.autonomyLevel,
      skills,
      territory: args.territory,
      permissions,
      tasksCompleted: 0,
      tasksWithBugs: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Add or update a skill
 */
export const updateSkill = mutation({
  args: {
    agentId: v.id("agents"),
    skillName: v.string(),
    proficiency: v.number(),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const record = await ctx.db
      .query("agentSkills")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!record) {
      throw new Error("Agent skills not initialized");
    }

    // Find existing skill or create new
    const existingIdx = record.skills.findIndex(
      (s) => s.name.toLowerCase() === args.skillName.toLowerCase()
    );

    const updatedSkills = [...record.skills];

    if (existingIdx >= 0) {
      updatedSkills[existingIdx] = {
        ...updatedSkills[existingIdx],
        proficiency: Math.min(100, Math.max(0, args.proficiency)),
        verified: args.verified ?? updatedSkills[existingIdx].verified,
        lastUsed: now,
      };
    } else {
      updatedSkills.push({
        name: args.skillName,
        proficiency: Math.min(100, Math.max(0, args.proficiency)),
        verified: args.verified ?? false,
        lastUsed: now,
      });
    }

    await ctx.db.patch(record._id, {
      skills: updatedSkills,
      updatedAt: now,
    });

    return { success: true, skill: args.skillName };
  },
});

/**
 * Record task completion (updates stats)
 */
export const recordTaskCompletion = mutation({
  args: {
    agentId: v.id("agents"),
    hadBugs: v.boolean(),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const record = await ctx.db
      .query("agentSkills")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!record) {
      throw new Error("Agent skills not initialized");
    }

    const newCompleted = record.tasksCompleted + 1;
    const newBugs = record.tasksWithBugs + (args.hadBugs ? 1 : 0);

    // Calculate running average duration
    let newAvgDuration = record.avgTaskDuration;
    if (args.durationMinutes !== undefined) {
      if (record.avgTaskDuration === undefined) {
        newAvgDuration = args.durationMinutes;
      } else {
        // Running average
        newAvgDuration =
          (record.avgTaskDuration * record.tasksCompleted + args.durationMinutes) /
          newCompleted;
      }
    }

    await ctx.db.patch(record._id, {
      tasksCompleted: newCompleted,
      tasksWithBugs: newBugs,
      avgTaskDuration: newAvgDuration,
      updatedAt: now,
    });

    // Calculate trust score
    const trustScore = newCompleted > 0 ? ((newCompleted - newBugs) / newCompleted) * 100 : 0;

    return {
      success: true,
      tasksCompleted: newCompleted,
      trustScore: Math.round(trustScore),
    };
  },
});

/**
 * Promote agent to next autonomy level (requires human approval in practice)
 */
export const promote = mutation({
  args: {
    agentId: v.id("agents"),
    newLevel: v.union(v.literal(2), v.literal(3)),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const record = await ctx.db
      .query("agentSkills")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!record) {
      throw new Error("Agent skills not initialized");
    }

    if (args.newLevel <= record.autonomyLevel) {
      throw new Error("Can only promote to higher level");
    }

    // Update permissions based on new level
    const permissions = {
      canPush: false, // Always requires approval
      canMerge: args.newLevel >= 3,
      canDeploy: false, // Always requires approval
      canEditSchema: args.newLevel >= 3,
      canApproveOthers: args.newLevel >= 3,
    };

    await ctx.db.patch(record._id, {
      autonomyLevel: args.newLevel,
      permissions,
      lastPromotedAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      newLevel: args.newLevel,
      levelName: AUTONOMY_LEVELS[args.newLevel],
    };
  },
});

/**
 * Check if agent can perform action in territory
 */
export const canEditFile = query({
  args: {
    agentId: v.id("agents"),
    filePath: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("agentSkills")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!record) {
      return { allowed: false, reason: "Agent skills not initialized" };
    }

    // Check if file path matches any territory pattern
    const matches = record.territory.some((pattern) =>
      args.filePath.startsWith(pattern.replace(/\/$/, ""))
    );

    if (!matches) {
      return {
        allowed: false,
        reason: `File outside territory. Agent territory: ${record.territory.join(", ")}`,
      };
    }

    // Intern level can only read
    if (record.autonomyLevel === 1) {
      return {
        allowed: false,
        reason: "Intern level cannot edit files (read-only)",
      };
    }

    return { allowed: true };
  },
});

/**
 * Get agent trust score and stats
 */
export const getTrustScore = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("agentSkills")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!record) {
      return null;
    }

    const trustScore =
      record.tasksCompleted > 0
        ? ((record.tasksCompleted - record.tasksWithBugs) / record.tasksCompleted) * 100
        : 0;

    return {
      trustScore: Math.round(trustScore),
      tasksCompleted: record.tasksCompleted,
      tasksWithBugs: record.tasksWithBugs,
      avgTaskDuration: record.avgTaskDuration
        ? Math.round(record.avgTaskDuration)
        : null,
      autonomyLevel: record.autonomyLevel,
      autonomyLevelName: AUTONOMY_LEVELS[record.autonomyLevel],
    };
  },
});
