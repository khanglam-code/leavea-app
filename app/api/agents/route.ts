import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// GET /api/agents - List all agents
export async function GET() {
  try {
    const agents = await convex.query(api.agents.list);
    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, role, avatar, teamId, openclawConfig, isMaster } = body;
    
    // Validate required fields
    if (!name || !role || !avatar) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, role, avatar" },
        { status: 400 }
      );
    }
    
    // Validate role
    const validRoles = ["master", "pm", "backend", "frontend", "fullstack", "qa", "research", "devops"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }
    
    // Create agent
    const agentId = await convex.mutation(api.agents.create, {
      name,
      role,
      avatar,
      teamId,
      openclawConfig,
      isMaster: isMaster || false,
    });
    
    // Fetch created agent
    const agent = await convex.query(api.agents.get, { id: agentId });
    
    return NextResponse.json({ 
      success: true, 
      message: `Agent "${name}" created successfully`,
      agent 
    });
  } catch (error) {
    console.error("Failed to create agent:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
