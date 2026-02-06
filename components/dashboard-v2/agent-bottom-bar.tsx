"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { AgentAvatar } from "@/components/ui/agent-avatar";

const statusDot: Record<string, string> = {
  online: "bg-emerald-400",
  busy: "bg-amber-400",
  idle: "bg-white/40",
  offline: "bg-white/20",
};

const roleLabels: Record<string, string> = {
  master: "Master",
  pm: "PM",
  backend: "BE",
  frontend: "FE",
  fullstack: "FS",
  qa: "QA",
  research: "R&D",
  devops: "DevOps",
};

// Mobile short names
const mobileRoleLabels: Record<string, string> = {
  master: "🧠",
  pm: "🧠",
  backend: "⚙️",
  frontend: "🎨",
  fullstack: "🖐️",
  qa: "🛡️",
  research: "🔬",
  devops: "🚀",
};

interface AgentBottomBarProps {
  selectedAgentId: Id<"agents"> | null;
  onAgentClick: (agentId: Id<"agents">) => void;
  className?: string;
}

type BarAgent = {
  _id: Id<"agents">;
  name: string;
  role: string;
  status: string;
  avatar: string;
  currentTaskIdentifier: string | null;
};

export function AgentBottomBar({ selectedAgentId, onAgentClick, className = "" }: AgentBottomBarProps) {
  const listAgents = useQuery(api.agents.list);

  const agents: BarAgent[] = (Array.isArray(listAgents) ? listAgents : []).map((a) => ({
    _id: a._id,
    name: a.name,
    role: a.role,
    status: a.status,
    avatar: a.avatar,
    currentTaskIdentifier: null,
  }));

  const handleAddAgents = () => {
    window.open("https://dashboard.convex.dev", "_blank");
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1.5 sm:gap-2 border-t border-border bg-card px-2 sm:px-3 py-1.5",
        // Mobile: fixed at bottom
        "fixed bottom-0 left-0 right-0 z-40 sm:relative sm:z-auto",
        className
      )}
    >
      {/* Agents Label - hidden on mobile */}
      <div className="hidden sm:flex items-center gap-1.5">
        <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">AGENTS</span>
        <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
          {agents.length}
        </span>
      </div>

      {/* Divider - hidden on mobile */}
      <div className="hidden sm:block h-5 w-px bg-border" />

      {/* Agent List */}
      <div className="flex flex-1 items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide">
        {agents.map((a) => {
          const dot = statusDot[(a.status ?? "").toLowerCase()] ?? statusDot.offline;
          const isSelected = selectedAgentId === a._id;
          return (
            <button
              key={a._id}
              type="button"
              onClick={() => onAgentClick(a._id)}
              className={cn(
                "inline-flex items-center gap-1 sm:gap-1.5 rounded-md border px-1.5 sm:px-2 py-1 text-left transition-all duration-150 shrink-0",
                "border-border bg-background hover:border-primary/30 hover:bg-accent",
                isSelected && "border-amber-400/50 bg-amber-400/10"
              )}
            >
              <AgentAvatar name={a.name} size={20} />
              
              {/* Mobile: compact view */}
              <div className="sm:hidden flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                <span className="text-xs font-medium">{a.name.charAt(0)}</span>
                <span className="text-[10px]">{mobileRoleLabels[a.role] ?? "👤"}</span>
              </div>

              {/* Desktop: full view */}
              <div className="hidden sm:block min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">{a.name}</span>
                  <span className="text-[10px] text-muted-foreground">{roleLabels[a.role] ?? a.role}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} aria-hidden />
                  <span className="text-[10px] text-muted-foreground capitalize">{a.status ?? "offline"}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add Agents Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddAgents}
        className="shrink-0 gap-1 sm:gap-1.5 h-7 text-xs px-1.5 sm:px-2"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Add Agents</span>
        <ExternalLink className="h-2.5 w-2.5 opacity-50 hidden sm:inline" />
      </Button>
    </div>
  );
}
