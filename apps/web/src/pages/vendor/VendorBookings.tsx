import { useState } from "react";
import { CalendarDays, Clock, CheckCircle2, XCircle, Loader2, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useApi } from "@/hooks/useApi";
import { bookingApi, Booking, BookingStatus } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Tab = "all" | "upcoming" | "past" | "cancelled";

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:   { label: "Pending",   color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",  icon: CheckCircle2 },
  completed: { label: "Completed", color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const TABS: { key: Tab; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "upcoming",  label: "Upcoming" },
  { key: "past",      label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

export default function VendorBookings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const queryParams =
    activeTab === "all" ? {} :
    activeTab === "cancelled" ? { status: "cancelled" as BookingStatus } :
    { type: activeTab as "upcoming" | "past" };

  const { data, loading, refetch } = useApi(() => bookingApi.list(queryParams), [activeTab]);
  const bookings: Booking[] = data?.bookings ?? [];

  const updateStatus = async (id: string, status: BookingStatus) => {
    setUpdatingId(id);
    try {
      await bookingApi.updateStatus(id, { status });
      toast({ title: `Booking ${status}` });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to update", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage incoming customer bookings</p>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {t.key !== "all" && data?.bookings && (
              <span className="ml-1.5 text-xs opacity-70">({data.bookings.length})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-card border rounded-2xl">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold mb-1">No {activeTab === "all" ? "" : activeTab} bookings yet</h3>
          <p className="text-sm text-muted-foreground">
            Customer bookings will appear here as they come in.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const cfg = statusConfig[b.status] ?? statusConfig.pending;
            const Icon = cfg.icon;
            const isUpdating = updatingId === b.id;
            return (
              <div key={b.id} className="bg-card border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1", cfg.color)}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {b.scheduledFor ? new Date(b.scheduledFor).toLocaleString() : "—"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">
                    {b.serviceName ?? b.service?.name ?? "Service"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Customer: {b.customerName ?? b.customer?.name ?? "—"}
                    {b.customerPhone && <> · {b.customerPhone}</>}
                  </p>
                  {b.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">"{b.notes}"</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/vendor/messages?customer=${b.customerId ?? ""}`}>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-3 h-3 mr-1" /> Message
                    </Button>
                  </Link>
                  {b.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(b.id, "confirmed")} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Accept"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "cancelled")} disabled={isUpdating}>
                        Decline
                      </Button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <Button size="sm" onClick={() => updateStatus(b.id, "completed")} disabled={isUpdating}>
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
