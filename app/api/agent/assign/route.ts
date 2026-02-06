/**
 * API Endpoint: Auto-assign task to appropriate agent
 * 
 * POST /api/agent/assign
 * 
 * Jason (Master Agent) calls this endpoint to:
 * 1. Create a task
 * 2. Auto-assign to the best-fit agent based on task type
 * 3. Notify the agent via OpenClaw Gateway
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { assignTaskToAgent, OpenClawConfig } from '@/lib/openclaw-connector';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Agent role to task keyword mapping
const ROLE_KEYWORDS: Record<string, string[]> = {
  backend: ['api', 'database', 'server', 'endpoint', 'auth', 'jwt', 'prisma', 'convex', 'query', 'mutation'],
  frontend: ['ui', 'component', 'react', 'css', 'style', 'layout', 'design', 'responsive', 'animation'],
  fullstack: ['feature', 'implement', 'build', 'create', 'full', 'integration'],
  qa: ['test', 'bug', 'fix', 'verify', 'validate', 'quality', 'regression'],
  devops: ['deploy', 'ci', 'cd', 'docker', 'kubernetes', 'pipeline', 'infrastructure'],
  research: ['research', 'analyze', 'investigate', 'explore', 'study', 'compare'],
};

interface AssignRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  preferredAgent?: string;  // Optional: specify agent name
  preferredTeam?: string;   // Optional: specify team name
  assignedBy: string;       // Jason or whoever is assigning
}

/**
 * Determine the best agent role based on task content
 */
function determineRole(title: string, description: string): string {
  const content = `${title} ${description}`.toLowerCase();
  
  let bestRole = 'fullstack';  // Default
  let maxMatches = 0;

  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    const matches = keywords.filter(kw => content.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestRole = role;
    }
  }

  return bestRole;
}

export async function POST(request: NextRequest) {
  try {
    const body: AssignRequest = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.priority || !body.projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, priority, projectId' },
        { status: 400 }
      );
    }

    // Get all agents
    const agents = await convex.query(api.agents.list);
    
    if (!agents || agents.length === 0) {
      return NextResponse.json(
        { error: 'No agents available' },
        { status: 404 }
      );
    }

    let selectedAgent = null;

    // 1. If preferred agent specified, use that
    if (body.preferredAgent) {
      selectedAgent = agents.find(
        a => a.name.toLowerCase() === body.preferredAgent?.toLowerCase()
      );
    }

    // 2. If preferred team specified, find available agent in that team
    if (!selectedAgent && body.preferredTeam) {
      const team = await convex.query(api.teams.getByName, { name: body.preferredTeam });
      if (team) {
        const teamAgents = agents.filter(a => a.teamId === team._id);
        // Prefer online agents, then idle, avoid busy/offline
        selectedAgent = teamAgents.find(a => a.status === 'online') 
          || teamAgents.find(a => a.status === 'idle')
          || teamAgents[0];
      }
    }

    // 3. Auto-determine based on task content
    if (!selectedAgent) {
      const bestRole = determineRole(body.title, body.description);
      
      // Find agents with matching role
      const roleAgents = agents.filter(a => a.role === bestRole);
      
      if (roleAgents.length > 0) {
        // Prefer online/idle agents
        selectedAgent = roleAgents.find(a => a.status === 'online')
          || roleAgents.find(a => a.status === 'idle')
          || roleAgents[0];
      } else {
        // Fallback to any fullstack or available agent
        selectedAgent = agents.find(a => a.role === 'fullstack' && a.status !== 'offline')
          || agents.find(a => a.status === 'online')
          || agents[0];
      }
    }

    if (!selectedAgent) {
      return NextResponse.json(
        { error: 'Could not find suitable agent' },
        { status: 404 }
      );
    }

    // Get the master agent (Jason) for createdBy
    const masterAgent = agents.find(a => a.isMaster || a.role === 'master');
    const creatorId = masterAgent?._id || selectedAgent._id;

    // Create the task
    const taskId = await convex.mutation(api.tasks.create, {
      agentName: body.assignedBy || 'jason',
      projectId: body.projectId as any,
      title: body.title,
      description: body.description,
      priority: body.priority,
      assignee: selectedAgent._id,
    });

    // If agent has OpenClaw config, notify them
    let notificationResult = null;
    if (selectedAgent.openclawConfig) {
      const config: OpenClawConfig = {
        gatewayUrl: selectedAgent.openclawConfig.gatewayUrl,
        token: selectedAgent.openclawConfig.token,
        sessionKey: selectedAgent.openclawConfig.sessionKey,
      };

      notificationResult = await assignTaskToAgent(config, {
        id: taskId,
        title: body.title,
        description: body.description,
        priority: body.priority,
        assignedBy: body.assignedBy || 'Jason (PM)',
      });
    }

    return NextResponse.json({
      success: true,
      taskId,
      assignedTo: {
        id: selectedAgent._id,
        name: selectedAgent.name,
        role: selectedAgent.role,
        status: selectedAgent.status,
      },
      autoAssignReason: body.preferredAgent 
        ? 'Preferred agent specified'
        : body.preferredTeam
        ? `Best available in team: ${body.preferredTeam}`
        : `Auto-assigned based on task content (role: ${selectedAgent.role})`,
      notification: notificationResult ? {
        sent: notificationResult.success,
        response: notificationResult.success ? notificationResult.content?.slice(0, 200) : null,
        error: notificationResult.error,
      } : {
        sent: false,
        reason: 'Agent has no OpenClaw config',
      },
    });

  } catch (error) {
    console.error('Task assignment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/assign - Get assignment suggestions without creating task
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '';
    const description = searchParams.get('description') || '';

    const bestRole = determineRole(title, description);
    const agents = await convex.query(api.agents.list);
    
    const suggestions = agents
      .filter(a => a.role === bestRole || a.role === 'fullstack')
      .map(a => ({
        id: a._id,
        name: a.name,
        role: a.role,
        status: a.status,
        recommended: a.role === bestRole,
        hasOpenClaw: !!a.openclawConfig,
      }))
      .sort((a, b) => {
        // Sort: recommended first, then by status (online > idle > busy > offline)
        if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
        const statusOrder = { online: 0, idle: 1, busy: 2, offline: 3 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      });

    return NextResponse.json({
      determinedRole: bestRole,
      suggestions,
    });

  } catch (error) {
    console.error('Suggestion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
