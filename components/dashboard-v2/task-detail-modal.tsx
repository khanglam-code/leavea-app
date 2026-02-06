"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { TaskCommentThread } from "./task-comment-thread";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, UserPlus, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanTask } from "./task-card";

interface TaskDetailModalProps {
  open: boolean;
  task: KanbanTask | null;
  onClose: () => void;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  done: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  in_progress: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  review: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  todo: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  backlog: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** AGT-181 fix: Ticket Detail Modal — opens on task card click */
export function TaskDetailModal({ open, task, onClose }: TaskDetailModalProps) {
  const taskId = task?.id as Id<"tasks"> | undefined;
  const fullTask = useQuery(
    api.tasks.get,
    taskId ? { id: taskId } : "skip"
  );
  const agents = useQuery(api.agents.list);
  const assignAgent = useMutation(api.tasks.assignAgent);
  
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const currentAssignee = fullTask?.assignee ?? task?.assigneeId;

  const handleAssign = async (agentId: Id<"agents">) => {
    if (!taskId) return;
    setIsAssigning(true);
    try {
      await assignAgent({ taskId, agentId });
      setShowAssignDropdown(false);
    } catch (err) {
      console.error("Failed to assign:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showAssignDropdown) return;
    const handleClickOutside = () => setShowAssignDropdown(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showAssignDropdown]);

  if (!open || !task) return null;

  const status = task.status ?? "todo";
  const statusStyle = statusColors[status] ?? statusColors.todo;
  const createdAt = fullTask?.createdAt ?? null;
  const updatedAt = task.updatedAt ?? fullTask?.updatedAt ?? null;
  const isCompleted = status === "done";
  const completedAt = isCompleted ? updatedAt : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[700px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              {task.linearIdentifier && (
                <span className={cn("font-mono text-sm font-semibold whitespace-nowrap", statusStyle.text)}>
                  {task.linearIdentifier}
                </span>
              )}
              <span
                className={cn(
                  "rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                  statusStyle.bg,
                  statusStyle.text,
                  statusStyle.border
                )}
              >
                {status.replace("_", " ")}
              </span>
              {task.priority && (
                <span className="text-xs text-muted-foreground">{priorityLabels[task.priority] ?? task.priority}</span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-foreground truncate" title={task.title}>
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">
          {/* Assignee with dropdown */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Assignee</h3>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssignDropdown(!showAssignDropdown);
                }}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                {currentAssignee ? (
                  <>
                    <AgentAvatar name={agents?.find(a => a._id === currentAssignee)?.name ?? "?"} size={24} />
                    <span className="text-foreground/70">
                      {agents?.find(a => a._id === currentAssignee)?.name ?? "Unknown"}
                    </span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Assign agent...</span>
                  </>
                )}
              </button>
              
              {/* Dropdown */}
              {showAssignDropdown && (
                <div 
                  className="absolute left-0 top-full mt-1 z-10 w-56 rounded-lg border border-border bg-popover shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-1">
                    {agents?.map((agent) => (
                      <button
                        key={agent._id}
                        type="button"
                        disabled={isAssigning}
                        onClick={() => handleAssign(agent._id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                          currentAssignee === agent._id && "bg-accent"
                        )}
                      >
                        <AgentAvatar name={agent.name} size={24} />
                        <div className="flex-1 text-left">
                          <p className="font-medium text-foreground">{agent.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{agent.role}</p>
                        </div>
                        {currentAssignee === agent._id && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {isAssigning && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </button>
                    ))}
                    {(!agents || agents.length === 0) && (
                      <p className="px-2 py-3 text-center text-sm text-muted-foreground">No agents available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</h3>
            <p className="text-sm text-foreground/60 whitespace-pre-wrap">
              {task.description || fullTask?.description || "—"}
            </p>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            {createdAt && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Created</h3>
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(createdAt, { addSuffix: true })}</p>
              </div>
            )}
            {updatedAt && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {isCompleted ? "Completed" : "Updated"}
                </h3>
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(updatedAt, { addSuffix: true })}</p>
              </div>
            )}
          </div>

          {/* Linear Link */}
          {task.linearUrl && (
            <div>
              <a
                href={task.linearUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded border border-border bg-muted/50 px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Linear
              </a>
            </div>
          )}

          {/* Comments */}
          {taskId && (
            <div className="border-t border-border pt-4">
              <TaskCommentThread taskId={taskId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
