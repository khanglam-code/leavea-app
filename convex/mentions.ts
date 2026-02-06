import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Parse @mentions from message content
 * Returns array of agent names (case-insensitive)
 *
 * @example
 * parseMentions("Hey @Sam and @Leo") // ["Sam", "Leo"]
 * parseMentions("@sam @SAM test") // ["sam", "SAM"] (duplicates preserved)
 * parseMentions("No mentions here") // []
 */
export function parseMentions(content: string): string[] {
  const mentionPattern = /@(\w+)/g;
  const matches = content.matchAll(mentionPattern);
  const mentions: string[] = [];

  for (const match of matches) {
    mentions.push(match[1]);
  }

  return mentions;
}

/**
 * Process message mentions and create notifications
 * - Finds agents by name (case-insensitive)
 * - Ignores self-mentions (sender mentioning themselves)
 * - Creates notification records for each valid mention
 * - Links notification to message via messageId
 */
export const processMessageMentions = internalMutation({
  args: {
    messageId: v.id("messages"),
    fromAgentId: v.id("agents"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { messageId, fromAgentId, content } = args;

    // Parse @mentions from content
    const mentionedNames = parseMentions(content);

    if (mentionedNames.length === 0) {
      return { processed: 0, notifications: [] };
    }

    // Get all agents to match names
    const allAgents = await ctx.db.query("agents").collect();

    // Find mentioned agents (case-insensitive matching)
    const mentionedAgents: Id<"agents">[] = [];
    const notificationIds: Id<"notifications">[] = [];

    for (const mentionedName of mentionedNames) {
      const agent = allAgents.find(
        (a) => a.name.toLowerCase() === mentionedName.toLowerCase()
      );

      if (agent && agent._id !== fromAgentId) {
        // Don't process self-mentions
        mentionedAgents.push(agent._id);

        // Create notification
        const notificationId = await ctx.db.insert("notifications", {
          to: agent._id,
          type: "mention",
          title: "You were mentioned",
          message: content.substring(0, 100),
          read: false,
          messageId: messageId,
          createdAt: Date.now(),
        });

        notificationIds.push(notificationId);
      }
    }

    // Update message with resolved mention IDs
    await ctx.db.patch(messageId, {
      mentions: mentionedAgents,
    });

    return {
      processed: mentionedAgents.length,
      notifications: notificationIds,
    };
  },
});
