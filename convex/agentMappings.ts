/**
 * Agent name → Convex/Linear mapping (ADR-001).
 * Caller passes agentName; activity attribution uses this, NOT Linear API key.
 */
import type { GenericDatabaseReader } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const AGENT_NAMES = ["max", "sam", "leo"] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

/** Resolve agent name to Convex agent ID. Throws if mapping missing. */
export async function resolveAgentIdByName(
  db: GenericDatabaseReader<DataModel>,
  agentName: string
): Promise<Id<"agents">> {
  const normalized = agentName.toLowerCase();
  const mapping = await db
    .query("agentMappings")
    .withIndex("by_name", (q) => q.eq("name", normalized))
    .first();
  if (!mapping) {
    throw new Error(
      `Agent mapping not found for "${agentName}". Ensure agentMappings has max/sam/leo (run seed).`
    );
  }
  return mapping.convexAgentId;
}

/** Get Linear user ID for agent (for API attribution). Returns undefined if not set. */
export async function getLinearUserIdByName(
  db: GenericDatabaseReader<DataModel>,
  agentName: string
): Promise<string | undefined> {
  const normalized = agentName.toLowerCase();
  const mapping = await db
    .query("agentMappings")
    .withIndex("by_name", (q) => q.eq("name", normalized))
    .first();
  return mapping?.linearUserId;
}

// --- Public API ---

export const getByAgentName = query({
  args: { agentName: v.string() },
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("agentMappings")
      .withIndex("by_name", (q) => q.eq("name", args.agentName.toLowerCase()))
      .first();
    return mapping ?? null;
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("agentMappings").collect();
  },
});

/** Set or update mapping: agentName → convexAgentId, optional linearUserId */
export const set = mutation({
  args: {
    name: v.string(),
    convexAgentId: v.id("agents"),
    linearUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalized = args.name.toLowerCase();
    const existing = await ctx.db
      .query("agentMappings")
      .withIndex("by_name", (q) => q.eq("name", normalized))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        convexAgentId: args.convexAgentId,
        linearUserId: args.linearUserId,
      });
      return existing._id;
    }
    return await ctx.db.insert("agentMappings", {
      name: normalized,
      convexAgentId: args.convexAgentId,
      linearUserId: args.linearUserId,
    });
  },
});
