"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AgentProfileProps {
  agentId: Id<"agents">;
  name: string;
  role: string;
  status: string;
  avatar: string;
  onClose: () => void;
  /** AGT-173: When true, omit header (used inside context panel) */
  embedded?: boolean;
}

/** AGT-155: Status dots — green / yellow / gray only (spec 5.6) */
const statusDot: Record<string, string> = {
  online: "bg-green-500",
  busy: "bg-yellow-500",
  idle: "bg-gray-500",
  offline: "bg-gray-500",
};

const roleLabels: Record<string, string> = {
  pm: "PM",
  backend: "Backend",
  frontend: "Frontend",
};

type TabId = "overview" | "tasks" | "activity" | "memory" | "heartbeat" | "messages";

const TABS: { id: TabId; label: string; count?: number }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "activity", label: "Activity" },
  { id: "memory", label: "Memory" },
  { id: "heartbeat", label: "Heartbeat" },
  { id: "messages", label: "Messages" },
];

/** AGT-155: Agent Profile v2 — 6 tabs, surface all available data */
export function AgentProfile({
  agentId,
  name,
  role,
  status,
  avatar,
  onClose,
  embedded = false,
}: AgentProfileProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sendAsName, setSendAsName] = useState<string>("max");
  const [messageDraft, setMessageDraft] = useState("");

  const agent = useQuery(api.agents.get, { id: agentId });
  const soulMemory = useQuery(api.agentMemory.getMemory, { agentId, type: "soul" });
  const workingMemory = useQuery(api.agentMemory.getMemory, { agentId, type: "working" });
  const dailyNotes = useQuery(api.agentMemory.listDailyNotes, { agentId, limit: 10 });
  const agentSkills = useQuery(api.skills.getByAgent, { agentId });
  const tasksForAgent = useQuery(api.tasks.getByAssignee, { assignee: agentId });
  const currentTaskId = (agent as { currentTask?: Id<"tasks"> } | null)?.currentTask;
  const currentTask = useQuery(api.tasks.get, currentTaskId ? { id: currentTaskId } : "skip");
  const activityForAgent = useQuery(api.activityEvents.getByAgent, { agentId, limit: 30 });
  const messagesForAgent = useQuery(api.agentMessages.listForAgent, { agentId, limit: 30 });
  const notificationsForAgent = useQuery(api.notifications.getByAgent, { agent: agentId });
  const agentsList = useQuery(api.agents.list);
  const sendMessage = useMutation(api.agentMessages.sendMessage);

  const full = agent as {
    soul?: string;
    about?: string;
    statusReason?: string;
    statusSince?: number;
    currentTask?: Id<"tasks">;
    lastSeen?: number;
    lastHeartbeat?: number;
  } | null;
  const statusReason = full?.statusReason ?? null;
  const statusSince = full?.statusSince;
  const soulFromAgent = full?.soul ?? full?.about ?? null;
  const soulContent = soulMemory?.content ?? soulFromAgent ?? "—";
  const workingContent = workingMemory?.content ?? "—";
  const dot = statusDot[status?.toLowerCase() ?? "offline"] ?? statusDot.offline;

  const taskStatusesForCount = ["todo", "in_progress", "backlog"];
  const tasksInScope =
    Array.isArray(tasksForAgent) &&
    tasksForAgent.filter((t: { status?: string }) =>
      taskStatusesForCount.includes((t.status ?? "").toLowerCase())
    );
  const taskCount = Array.isArray(tasksInScope) ? tasksInScope.length : 0;
  const notificationCount = Array.isArray(notificationsForAgent) ? notificationsForAgent.length : 0;

  const otherAgents = Array.isArray(agentsList)
    ? (agentsList as { _id: Id<"agents">; name: string }[])
        .filter((a) => a._id !== agentId)
        .map((a) => a.name.toLowerCase())
    : [];

  const handleSendMessage = async () => {
    const content = messageDraft.trim();
    if (!content || !otherAgents?.includes(sendAsName)) return;
    try {
      await sendMessage({
        fromAgentName: sendAsName,
        toAgentName: name.toLowerCase(),
        type: "fyi",
        content,
      });
      setMessageDraft("");
    } catch {
      // leave draft on error
    }
  };

  const currentTaskDoc = currentTask as { title?: string; linearIdentifier?: string; linearUrl?: string } | null;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Sticky header on mobile */}
      <div className="sticky top-0 z-10 bg-background">
        {!embedded && (
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Profile</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground text-xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}

        {/* Identity + Status — compact */}
        <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <AgentAvatar name={name} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{roleLabels[role] ?? role}</p>
          </div>
          <span className={cn("h-2 w-2 shrink-0 rounded-full border border-background", dot)} />
        </div>
        {statusReason && <p className="mt-1 text-xs italic text-muted-foreground">{statusReason}</p>}
        {statusSince != null && (
          <p className="text-xs text-muted-foreground/60">Since {formatDistanceToNow(statusSince, { addSuffix: true })}</p>
        )}
        {full?.lastSeen != null && (
          <p className="text-xs text-muted-foreground/60">Last seen {formatDistanceToNow(full.lastSeen, { addSuffix: true })}</p>
        )}
        {currentTaskDoc && (
          <p className="mt-1 text-xs text-muted-foreground">
            Current:{" "}
            <a
              href={currentTaskDoc.linearUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-muted-foreground hover:text-foreground"
            >
              {currentTaskDoc.linearIdentifier ?? "—"}
            </a>{" "}
            {currentTaskDoc.title ?? ""}
          </p>
        )}
        </div>

        {/* 6 Tabs */}
        <div className="flex shrink-0 border-b border-border overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wider",
                activeTab === tab.id
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              {tab.id === "tasks" && taskCount > 0 ? `Tasks (${taskCount})` : tab.label}
              {tab.id === "messages" && Array.isArray(messagesForAgent) && messagesForAgent.length > 0 ? ` (${messagesForAgent.length})` : ""}
              {tab.id === "memory" && Array.isArray(dailyNotes) && dailyNotes.length > 0 ? ` (${dailyNotes.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">SOUL</h4>
              <div className="mt-2 text-sm text-foreground/70 whitespace-pre-wrap">
                {soulContent}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">Skills</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {agentSkills?.skills?.length ? (
                  agentSkills.skills.map((s: { name: string; proficiency?: number; verified?: boolean }) => (
                    <span
                      key={s.name}
                      className="rounded-[10px] border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {s.name}
                      {s.proficiency != null ? ` ${s.proficiency}%` : ""}
                      {s.verified && " ✓"}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
            {agentSkills && (
              <p className="text-sm text-muted-foreground">
                {agentSkills.autonomyLevelName ?? "—"} · {agentSkills.tasksCompleted ?? 0} completed
              </p>
            )}
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-4">
            {["todo", "in_progress", "backlog", "review", "done"].map((groupStatus) => {
              const group = Array.isArray(tasksForAgent)
                ? tasksForAgent.filter((t: { status?: string }) => (t.status ?? "").toLowerCase() === groupStatus)
                : [];
              const label = groupStatus === "backlog" ? "Blocked" : groupStatus.replace("_", " ");
              return (
                <div key={groupStatus}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    {label} ({group.length})
                  </h4>
                  <ul className="mt-1.5 space-y-1">
                    {group.length === 0 ? (
                      <li className="text-xs text-muted-foreground/60">—</li>
                    ) : (
                      group.map((t: { _id: Id<"tasks">; title?: string; linearIdentifier?: string; linearUrl?: string }) => (
                        <li key={t._id}>
                          <a
                            href={t.linearUrl ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-foreground/70 hover:text-foreground"
                          >
                            <span className="font-mono text-xs text-muted-foreground">{t.linearIdentifier ?? "—"}</span>{" "}
                            {t.title ?? "—"}
                          </a>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-2">
            {Array.isArray(activityForAgent) && activityForAgent.length > 0 ? (
              activityForAgent.slice(0, 25).map((e: { _id: string; title?: string; description?: string; eventType?: string; linearIdentifier?: string; timestamp?: number }) => {
                const eventColors: Record<string, string> = {
                  created: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                  assigned: "bg-purple-500/20 text-purple-400 border-purple-500/30",
                  completed: "bg-green-500/20 text-green-400 border-green-500/30",
                  status_change: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                };
                const badgeColor = eventColors[e.eventType ?? ""] ?? "bg-muted text-muted-foreground border-border";
                const eventLabel = e.eventType?.replace("_", " ") ?? "update";
                
                return (
                  <div key={e._id} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${badgeColor}`}>
                          {eventLabel}
                        </span>
                        {e.linearIdentifier && (
                          <span className="font-mono text-xs text-muted-foreground">{e.linearIdentifier}</span>
                        )}
                      </div>
                      {e.timestamp != null && (
                        <span className="shrink-0 text-[10px] text-muted-foreground/60">
                          {formatDistanceToNow(e.timestamp, { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-foreground/80 line-clamp-2">{e.title ?? "—"}</p>
                    {e.description && e.description !== e.title && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{e.description}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <ul className="space-y-2">
            {Array.isArray(messagesForAgent) && messagesForAgent.length > 0 ? (
              messagesForAgent.slice(0, 20).map((m: { _id: Id<"agentMessages">; content?: string; fromAgent?: { name: string } | null; toAgent?: { name: string } | null; type?: string; timestamp?: number }) => (
                <li key={m._id} className="rounded border border-border bg-muted/50 px-2 py-1.5 text-sm text-foreground/70">
                  <span className="text-xs text-muted-foreground">
                    {m.fromAgent?.name ?? "?"} → {m.toAgent?.name ?? "?"}
                    {m.type && ` · ${m.type}`}
                    {m.timestamp != null && ` · ${formatDistanceToNow(m.timestamp, { addSuffix: true })}`}
                  </span>
                  <p className="mt-0.5">{m.content ?? "—"}</p>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No messages</p>
            )}
          </ul>
        )}

        {activeTab === "memory" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">Working (current session)</h4>
              <div className="mt-2 whitespace-pre-wrap text-sm text-foreground/70">{workingContent}</div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">Daily notes</h4>
              {Array.isArray(dailyNotes) && dailyNotes.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {dailyNotes.map((note: { _id: string; date?: string; content?: string; updatedAt?: number }) => (
                    <li key={note._id} className="rounded border border-border bg-muted/50 px-2 py-2">
                      <span className="font-mono text-xs text-muted-foreground">{note.date ?? "—"}</span>
                      {note.updatedAt != null && (
                        <span className="ml-2 text-xs text-muted-foreground/60">{formatDistanceToNow(note.updatedAt, { addSuffix: true })}</span>
                      )}
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/70">{note.content ?? "—"}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No daily notes</p>
              )}
            </div>
            {Array.isArray(notificationsForAgent) && notificationsForAgent.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">Notifications ({notificationCount})</h4>
                <ul className="mt-2 space-y-1">
                  {notificationsForAgent.slice(0, 10).map((n: { _id: string; type?: string; title?: string; message?: string; read?: boolean; createdAt?: number }) => (
                    <li key={n._id} className="flex items-center gap-2 border-b border-border py-1.5 text-sm">
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-foreground" />}
                      <span className="text-xs text-muted-foreground">{n.type ?? "—"}</span>
                      <span className="truncate flex-1">{n.title ?? n.message ?? "—"}</span>
                      {n.createdAt != null && <span className="text-xs text-muted-foreground/60">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "heartbeat" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">Last heartbeat</h4>
              <p className="mt-1 text-sm text-foreground/70">
                {full?.lastHeartbeat != null
                  ? formatDistanceToNow(full.lastHeartbeat, { addSuffix: true })
                  : "—"}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">Uptime since last beat</h4>
              <p className="mt-1 text-sm text-foreground/70">
                {full?.lastHeartbeat != null
                  ? formatDistanceToNow(full.lastHeartbeat)
                  : "—"}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">Status</h4>
              <p className="mt-1 text-sm text-foreground/70">
                {full?.lastHeartbeat != null
                  ? (() => {
                      const ageMs = Date.now() - full.lastHeartbeat;
                      if (ageMs < 5 * 60 * 1000) return "healthy";
                      if (ageMs < 15 * 60 * 1000) return "stale";
                      return "offline";
                    })()
                  : "offline"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Send message — fixed at bottom */}
      <div className="shrink-0 border-t border-border p-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">Send message</h4>
        {Array.isArray(otherAgents) && otherAgents.length > 0 && (
          <div className="mt-1 flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Send as:</label>
            <select
              value={sendAsName}
              onChange={(e) => setSendAsName(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              {otherAgents.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
        <textarea
          placeholder="Type a message..."
          value={messageDraft}
          onChange={(e) => setMessageDraft(e.target.value)}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          rows={2}
        />
        <Button
          type="button"
          onClick={handleSendMessage}
          disabled={!messageDraft.trim()}
          className="mt-2"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
