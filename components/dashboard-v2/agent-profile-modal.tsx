"use client";

import { useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { AgentProfile } from "./agent-profile";

interface AgentProfileModalProps {
  open: boolean;
  agentId: Id<"agents"> | null;
  name: string;
  role: string;
  status: string;
  avatar: string;
  onClose: () => void;
}

/** AGT-181: Agent Profile Modal — fullscreen on mobile, modal on desktop */
export function AgentProfileModal({
  open,
  agentId,
  name,
  role,
  status,
  avatar,
  onClose,
}: AgentProfileModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || !agentId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className={
          // Mobile: full screen, Desktop: modal with scroll
          "w-full h-full sm:h-[90vh] sm:max-w-2xl sm:rounded-xl " +
          "border-0 sm:border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <AgentProfile
          agentId={agentId}
          name={name}
          role={role}
          status={status}
          avatar={avatar}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
