"use client";

import { AgentAvatar } from "@/components/ui/agent-avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type KanbanStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
type Priority = "low" | "medium" | "high" | "urgent";

const priorityColors: Record<Priority, string> = {
  urgent: "border-l-red-500",
  high: "border-l-green-500",
  medium: "border-l-yellow-500",
  low: "border-l-gray-500",
};

export interface KanbanTask {
  id: string;
  title: string;
  status: KanbanStatus;
  priority: Priority;
  assigneeId?: string;
  assigneeAvatar?: string;
  assigneeName?: string;
  linearIdentifier?: string;
  linearUrl?: string;
  updatedAt?: number;
  tags?: string[];
  description?: string;
}

interface TaskCardProps {
  task: KanbanTask;
  onClick?: () => void;
  onAssigneeClick?: (agentId: string) => void;
}

export function TaskCard({ task, onClick, onAssigneeClick }: TaskCardProps) {
  const priority = (task.priority ?? "low") as Priority;
  const barColor = priorityColors[priority] ?? priorityColors.low;

  const handleAssigneeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.assigneeId && onAssigneeClick) onAssigneeClick(task.assigneeId);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border border-border bg-background p-2.5 sm:p-3 text-left transition-colors hover:border-primary/30 hover:bg-accent active:scale-[0.98]",
        "border-l-4",
        barColor
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
          {task.linearIdentifier && (
            <a
              href={task.linearUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              {task.linearIdentifier}
            </a>
          )}
        </div>
        {task.assigneeName && (
          <span
            role={onAssigneeClick && task.assigneeId ? "button" : undefined}
            onClick={onAssigneeClick && task.assigneeId ? handleAssigneeClick : undefined}
            className={cn(
              "shrink-0",
              onAssigneeClick && task.assigneeId && "cursor-pointer rounded-full hover:ring-2 hover:ring-ring"
            )}
            title={onAssigneeClick && task.assigneeId ? `Open ${task.assigneeName ?? "agent"}` : undefined}
          >
            <AgentAvatar name={task.assigneeName} size={24} />
          </span>
        )}
      </div>
      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {task.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {tag}
          </span>
        ))}
        {task.updatedAt != null && (
          <span className="text-xs text-muted-foreground/60">{formatDistanceToNow(task.updatedAt, { addSuffix: true })}</span>
        )}
      </div>
    </button>
  );
}
