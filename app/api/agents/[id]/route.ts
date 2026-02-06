import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// GET /api/agents/[id] - Get agent by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await convex.query(api.agents.get, { 
      id: id as Id<"agents"> 
    });
    
    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error("Failed to fetch agent:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/[id] - Update agent
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { name, role, avatar, teamId, isMaster, openclawConfig, status } = body;
    
    // Update basic info if provided
    if (name || role || avatar || teamId !== undefined || isMaster !== undefined) {
      await convex.mutation(api.agents.update, {
        id: id as Id<"agents">,
        ...(name && { name }),
        ...(role && { role }),
        ...(avatar && { avatar }),
        ...(teamId && { teamId }),
        ...(isMaster !== undefined && { isMaster }),
      });
    }
    
    // Update OpenClaw config if provided
    if (openclawConfig) {
      await convex.mutation(api.agents.updateOpenClawConfig, {
        id: id as Id<"agents">,
        openclawConfig,
      });
    }
    
    // Update status if provided
    if (status) {
      await convex.mutation(api.agents.updateStatus, {
        id: id as Id<"agents">,
        status,
      });
    }
    
    // Fetch updated agent
    const agent = await convex.query(api.agents.get, { 
      id: id as Id<"agents"> 
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Agent updated successfully",
      agent 
    });
  } catch (error) {
    console.error("Failed to update agent:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id] - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await convex.mutation(api.agents.remove, { 
      id: id as Id<"agents"> 
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Agent deleted successfully" 
    });
  } catch (error) {
    console.error("Failed to delete agent:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
