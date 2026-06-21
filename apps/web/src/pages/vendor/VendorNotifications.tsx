import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Loader2, MessageSquare, Calendar, DollarSign, Megaphone, Heart } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { notificationApi, Notification } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const ICON_MAP: Record<string, any> = {
  message: MessageSquare,
  booking: Calendar,
  payment: DollarSign,
  announcement: Megaphone,
  follow: Heart,
  review: Heart,
  subscription: DollarSign,
};

export default function VendorNotifications() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data, loading, refetch } = useApi(
    () => notificationApi.list({ unreadOnly: filter === "unread" }),
    [filter]
  );

  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      toast({ title: "All notifications marked as read" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === "all" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === "unread" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === "unread" ? "You're all caught up!" : "We'll notify you when something important happens."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = ICON_MAP[notification.type] || Bell;
            return (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-sm ${!notification.read ? "border-primary/30 bg-primary/5" : ""}`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    !notification.read ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Icon className={`w-5 h-5 ${!notification.read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-semibold text-sm ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <Badge variant="default" className="shrink-0 h-5">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.body}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                      {!notification.read && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="text-primary hover:underline font-medium flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Mark as read
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
