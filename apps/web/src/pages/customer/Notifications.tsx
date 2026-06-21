import { Bell, MessageSquare, Star, Megaphone, Info, CalendarDays, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { notificationApi, Notification, NotificationType } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const icons: Record<NotificationType, React.ComponentType<{ size?: number; className?: string }>> = {
  message:      MessageSquare,
  review:       Star,
  announcement: Megaphone,
  booking:      CalendarDays,
  payment:      Info,
  subscription: Info,
  follow:       Users,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function Notifications() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data, loading, refetch } = useApi(() => notificationApi.list());
  const items: Notification[] = data?.notifications ?? [];
  const unreadCount = items.filter(n => !n.read).length;

  const markRead = async (n: Notification) => {
    if (!n.read) {
      try {
        await notificationApi.markRead(n.id);
        refetch();
      } catch { /* silent */ }
    }
    if (n.link) setLocation(n.link);
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      toast({ title: "All notifications marked as read" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold mb-1">Notifications</h1>
            <p className="text-muted-foreground">Stay updated on your activity.</p>
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold mb-1">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on your activity.
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-primary text-sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Bell size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">All caught up</h3>
          <p className="text-muted-foreground text-sm">No notifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n: Notification) => {
            const Icon = icons[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                onClick={() => markRead(n)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:border-primary/30",
                  n.read ? "bg-card" : "bg-primary/5 border-primary/20"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  n.read ? "bg-muted" : "bg-primary/10"
                )}>
                  <Icon size={16} className={n.read ? "text-muted-foreground" : "text-primary"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
