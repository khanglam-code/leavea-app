"use client";

import { useState, useEffect } from "react";
import { Settings, Menu, X } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";

interface TopBarProps {
  agentsActive?: number;
  tasksInQueue?: number;
  inProgress?: number;
  doneToday?: number;
  totalTasks?: number;
  onSettingsClick?: () => void;
  notificationTotalUnread?: number;
  onBellClick?: () => void;
}

export function TopBar({
  agentsActive = 0,
  tasksInQueue = 0,
  inProgress = 0,
  doneToday = 0,
  totalTasks = 0,
  onSettingsClick,
  notificationTotalUnread = 0,
  onBellClick,
}: TopBarProps) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-2 sm:px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <img src="/logo.svg" alt="neXus" className="h-5 sm:h-6" />
          <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Command Center
          </span>
        </div>

        {/* Center: Stats - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
            In Progress <span className="font-medium text-foreground">{inProgress}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
            Done <span className="font-medium text-foreground">{doneToday}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
            Total <span className="font-medium text-foreground">{totalTasks}</span>
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Time - hidden on small mobile */}
          <div className="hidden sm:block text-right text-xs">
            <div className="font-mono text-foreground">{time}</div>
            <div className="text-muted-foreground">{date}</div>
          </div>

          <NotificationBell
            totalUnread={notificationTotalUnread}
            onBellClick={onBellClick}
          />

          {/* Online indicator - hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Online
          </div>

          {onSettingsClick && (
            <button
              type="button"
              onClick={onSettingsClick}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown stats */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-3 py-2 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
              🔄 In Progress <span className="font-medium text-foreground">{inProgress}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
              ✅ Done <span className="font-medium text-foreground">{doneToday}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
              📋 Total <span className="font-medium text-foreground">{totalTasks}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
              🟢 Online
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {time} · {date}
          </div>
        </div>
      )}
    </>
  );
}
