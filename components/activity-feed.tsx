"use client";

import { AgentAvatar } from "@/components/ui/agent-avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// AGT-137: Unified activityEvents schema
interface ActivityEvent {
  _id: string;
  agentId: string;
  agentName: string;
  agent?: { name?: string; avatar?: string } | null;
  eventType: string;
  title: string;
  linearIdentifier?: string;
  timestamp: number;
}

interface ActivityFeedProps {
  activities: ActivityEvent[] | Array<Record<string, unknown>>;
}

const eventTypeToVerb: Record<string, string> = {
  created: "created",
  status_change: "moved",
  assigned: "assigned",
  updated: "updated",
  deleted: "deleted",
  completed: "completed",
  started: "started",
  commented: "commented on",
  push: "pushed",
  pr_opened: "opened PR",
  pr_merged: "merged PR",
  deploy_success: "deployed",
  deploy_failed: "deployment failed",
  sync_completed: "synced",
};

/** AGT-180: Verb colors for light/dark themes */
const verbColorsDark: Record<string, string> = {
  completed: "text-emerald-400",
  created: "text-blue-400",
  moved: "text-yellow-400",
  assigned: "text-purple-400",
};
const verbColorsLight: Record<string, string> = {
  completed: "text-emerald-600",
  created: "text-blue-600",
  moved: "text-yellow-600",
  assigned: "text-purple-600",
};

/** AGT-163: Spec 5.5 — 40px row, ticket ID + title, no raw Convex IDs */
export function ActivityFeed({ activities }: ActivityFeedProps) {
  const safe = Array.isArray(activities) ? activities : [];
  const list = safe.slice(0, 20);

  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent activity</p>;
  }

  return (
    <ul className="space-y-0">
      {list.map((activity, index) => {
        const raw = activity as Record<string, unknown>;
        const ts = typeof raw.timestamp === "number" ? raw.timestamp : 0;
        const key = raw._id && String(raw._id).length > 0 ? String(raw._id) : `activity-${index}`;
        const agent = raw.agent as { name?: string; avatar?: string } | null | undefined;
        const agentName = String(agent?.name ?? raw.agentName ?? "Unknown");
        const verb = eventTypeToVerb[String(raw.eventType ?? "")] ?? String(raw.eventType ?? "updated");
        const ticketId = typeof raw.linearIdentifier === "string" ? raw.linearIdentifier : "—";
        const title = typeof raw.title === "string" ? raw.title : "—";
        const metadata = raw.metadata as { commitHash?: string } | undefined;
        const commitHash = typeof metadata?.commitHash === "string" ? metadata.commitHash : null;

        const verbColorDark = verbColorsDark[verb] ?? "text-muted-foreground";
        const verbColorLight = verbColorsLight[verb] ?? "text-muted-foreground";

        return (
          <li
            key={key}
            className="flex min-h-[3.5rem] flex-col justify-center gap-0.5 border-b border-border py-2.5 px-3 transition-colors hover:bg-accent/50"
          >
            <div className="flex min-h-[1.25rem] items-center gap-2">
              <AgentAvatar name={agentName} size={20} />
              <span className="w-12 shrink-0 truncate text-xs font-medium text-foreground/80" title={agentName}>
                {agentName}
              </span>
              <span className={cn("shrink-0 truncate text-xs", verbColorLight, `dark:${verbColorDark}`)}>{verb}</span>
              <span className="min-w-0 shrink-0 font-mono text-xs text-foreground/70 whitespace-nowrap">{ticketId}</span>
              <span className="min-w-0 flex-1" aria-hidden />
              <span className="shrink-0 text-[10px] text-muted-foreground ml-auto">
                {formatDistanceToNow(ts, { addSuffix: true })}
              </span>
            </div>
            <div className="flex min-h-[1rem] items-center gap-2 pl-7">
              <span className="min-w-0 max-w-full flex-1 truncate text-xs text-muted-foreground" title={title}>
                {title}
              </span>
              {commitHash && (
                <span className="shrink-0 font-mono text-[10px] text-amber-500 dark:text-amber-400/70" title="Commit">
                  {commitHash.slice(0, 7)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
