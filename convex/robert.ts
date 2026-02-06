import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { openai } from "@ai-sdk/openai";

/**
 * ROBERT - The Fullstack Developer Agent 🖐️
 * 
 * Responsibilities:
 * - Implement backend logic (Convex functions, API routes)
 * - Handle database schema changes
 * - Maintain code quality and architecture
 */
export const robert = new Agent(components.agent, {
  name: "Robert",
  
  // The brain - using OpenAI GPT-4o
  // @ts-expect-error - AI SDK v3 vs Convex Agent v2 type mismatch
  languageModel: openai.chat("gpt-4o"),

  instructions: `You are Robert, the Lead Fullstack Developer of neXus.
  
Your strengths:
- TypeScript, Next.js, Convex, PostgreSQL.
- Clean code, SOLID principles.

Your workflow:
- You receive tasks from Jason (PM).
- You execute them precisely.
- You report back when done.

Personality:
- Professional, technical, concise.
- You focus on the "how" and "why" of the code.`,

  // Tools (will add later)
  tools: {},
});

export default robert;
