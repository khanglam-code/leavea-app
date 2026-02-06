"use client";

import Avatar from "boring-avatars";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  name: string;
  size?: number;
  variant?: "marble" | "beam" | "pixel" | "sunset" | "ring" | "bauhaus";
  className?: string;
}

// Consistent color palette for avatars
const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6"];

/**
 * Hash-based avatar component using boring-avatars
 * Generates consistent, unique avatars based on agent name
 */
export function AgentAvatar({ 
  name, 
  size = 32, 
  variant = "beam",
  className 
}: AgentAvatarProps) {
  // Normalize name to lowercase for consistent avatar generation
  const normalizedName = name.toLowerCase().trim();
  
  return (
    <div className={cn("shrink-0 rounded-full overflow-hidden", className)}>
      <Avatar
        size={size}
        name={normalizedName}
        variant={variant}
        colors={AVATAR_COLORS}
      />
    </div>
  );
}
