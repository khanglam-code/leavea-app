import { AgentAvatar } from "@/components/ui/agent-avatar";
import { MessageSquare, Clipboard, RefreshCw, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** AGT-116: @mention blue, Assignment green, Comment gray */
export type NotificationType = "mention" | "assignment" | "status_change" | "comment" | "review_request" | "dm";

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  agentName: string;
  agentAvatar: string;
  title: string;
  timestamp: Date | number;
  isUnread: boolean;
  onClick?: () => void;
  /** AGT-180: Task detail for notification */
  taskSummary?: {
    id: string;
    title?: string;
    linearIdentifier?: string;
    linearUrl?: string;
    status?: string;
    priority?: string;
  } | null;
}

const typeIcons: Record<string, typeof MessageSquare> = {
  mention: MessageSquare,
  assignment: Clipboard,
  status_change: RefreshCw,
  comment: MessageCircle,
  review_request: MessageSquare,
  dm: MessageSquare,
};

const typeColors: Record<string, string> = {
  mention: "text-blue-500",
  assignment: "text-green-500",
  status_change: "text-yellow-500",
  comment: "text-zinc-500",
  review_request: "text-zinc-500",
  dm: "text-zinc-500",
};

export function NotificationItem({
  type,
  agentName,
  agentAvatar,
  title,
  timestamp,
  isUnread,
  onClick,
  taskSummary,
}: NotificationItemProps) {
  const Icon = typeIcons[type] ?? MessageCircle;

  const formatTime = (date: Date | number) => {
    const now = Date.now();
    const ts = typeof date === "number" ? date : date.getTime();
    const diff = now - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent",
        isUnread && "bg-accent/50"
      )}
    >
      {/* Unread dot */}
      {isUnread && (
        <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
      )}
      {!isUnread && <div className="mt-1 h-2 w-2 flex-shrink-0" />}

      {/* Avatar */}
      <AgentAvatar name={agentName} size={32} />

      {/* Content */}
      <div className="flex-1 space-y-1">
        {taskSummary?.linearIdentifier ? (
          <div className="space-y-0.5">
            <p className="text-sm text-foreground/80">
              <span className="font-mono font-semibold whitespace-nowrap">{taskSummary.linearIdentifier}</span>
              {type === "assignment" && " assigned to you"}
              {type === "mention" && " mentioned you"}
              {type === "status_change" && " status changed"}
            </p>
            {taskSummary.title && (
              <p className="text-xs text-muted-foreground truncate" title={taskSummary.title}>
                "{taskSummary.title}"
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-foreground/80">{title}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className={cn("h-3 w-3", typeColors[type])} />
          <span>{formatTime(timestamp)}</span>
        </div>
      </div>
    </button>
  );
}
