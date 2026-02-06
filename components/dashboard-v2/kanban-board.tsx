"use client";

import { useMemo, useRef } from "react";
import { TaskCard } from "./task-card";
import type { KanbanTask } from "./task-card";
import { cn } from "@/lib/utils";

export type { KanbanTask };

type KanbanStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

const COLUMNS: { status: KanbanStatus; title: string; emoji: string }[] = [
  { status: "backlog", title: "BACKLOG", emoji: "📋" },
  { status: "todo", title: "TODO", emoji: "📝" },
  { status: "in_progress", title: "IN PROGRESS", emoji: "🔄" },
  { status: "done", title: "DONE", emoji: "✅" },
];

interface KanbanBoardProps {
  tasks: KanbanTask[];
  onTaskClick?: (task: KanbanTask) => void;
  onAssigneeClick?: (agentId: string) => void;
  className?: string;
}

export function KanbanBoard({ tasks, onTaskClick, onAssigneeClick, className = "" }: KanbanBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const byStatus = (status: KanbanStatus) => {
    if (status === "in_progress") {
      return tasks.filter((t) => t.status === "in_progress" || t.status === "review");
    }
    return tasks.filter((t) => t.status === status);
  };

  const counts = useMemo(() => {
    const backlog = tasks.filter((t) => t.status === "backlog").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress" || t.status === "review").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const total = backlog + todo + inProgress + done;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { backlog, todo, inProgress, done, total, completionRate };
  }, [tasks]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Kanban board - horizontal scroll with snap on mobile */}
      <div
        ref={scrollRef}
        className={cn(
          "flex h-full gap-3 overflow-x-auto p-3 sm:p-4",
          // Mobile: snap scrolling like Trello
          "snap-x snap-mandatory scroll-smooth",
          // Hide scrollbar on mobile for cleaner look
          "scrollbar-hide sm:scrollbar-default"
        )}
      >
        {COLUMNS.map((col) => {
          const columnTasks = byStatus(col.status);
          const isEmpty = columnTasks.length === 0;
          const isDone = col.status === "done";
          
          return (
            <div
              key={col.status}
              className={cn(
                "flex flex-col rounded-lg border border-border bg-card",
                // Mobile: full width columns with snap
                "w-[85vw] min-w-[85vw] snap-center",
                // Tablet: slightly smaller
                "sm:w-[45vw] sm:min-w-[280px]",
                // Desktop: flexible
                "md:w-auto md:min-w-[220px] md:flex-1"
              )}
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-border px-3 py-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-sm">{col.emoji}</span>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {col.title}
                  </h3>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
              
              {/* Tasks */}
              <div className="flex-1 space-y-2 overflow-y-auto p-2 min-h-0">
                {isEmpty ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {isDone ? "No completed tasks" : `No tasks in ${col.title.toLowerCase()}`}
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                      onAssigneeClick={onAssigneeClick}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Analytics panel - only on large screens */}
        <div className="hidden lg:flex w-52 shrink-0 flex-col rounded-lg border border-border bg-card">
          <div className="border-b border-border px-3 py-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Analytics</h3>
          </div>
          <div className="flex-1 space-y-3 p-3">
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Completion</span>
              <div className="mt-1 text-2xl font-semibold text-amber-500 dark:text-amber-400">{counts.completionRate}%</div>
              <div className="text-xs text-muted-foreground">({counts.done}/{counts.total})</div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-500 dark:bg-amber-400 transition-[width] duration-300"
                  style={{ width: `${Math.min(100, counts.completionRate)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">In Progress</span>
                </div>
                <span className="text-lg font-semibold text-blue-500 dark:text-blue-400">{counts.inProgress}</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 dark:bg-yellow-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Queue</span>
                </div>
                <span className="text-lg font-semibold text-yellow-500 dark:text-yellow-400">{counts.todo}</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Backlog</span>
                </div>
                <span className="text-lg font-semibold text-foreground/60">{counts.backlog}</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Done</span>
                </div>
                <span className="text-lg font-semibold text-green-500 dark:text-green-400">{counts.done}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
