"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ActivityFeed } from "@/components/activity-feed";
import { normalizeActivities } from "@/lib/activity-utils";
import { cn } from "@/lib/utils";

/** AGT-181 step 3: Activity feed with filter tabs: All, Completed, Created, Moved */
const EVENT_FILTERS = ["all", "completed", "created", "moved"] as const;
type EventFilter = (typeof EVENT_FILTERS)[number];

const eventTypeMap: Record<string, string> = {
  completed: "completed",
  created: "created",
  status_change: "moved",
};

export function ActivityPage() {
  const [filter, setFilter] = useState<EventFilter>("all");

  const raw = useQuery(api.activityEvents.list, { limit: 50 });
  const normalized = useMemo(() => normalizeActivities(raw ?? []), [raw]);

  const activities = useMemo(() => {
    if (filter === "all") return normalized;
    return normalized.filter((a) => {
      const eventType = (a as { eventType?: string })?.eventType ?? "";
      return eventTypeMap[filter] === eventType || eventTypeMap[filter] === eventTypeMap[eventType];
    });
  }, [normalized, filter]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex gap-1">
          {EVENT_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded border px-2 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors",
                filter === f
                  ? "border-primary/30 bg-accent text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
              )}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
