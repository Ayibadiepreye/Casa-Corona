import { useState } from "react";
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { bookingApi, Booking, BookingStatus } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

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

export default function Bookings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [cancelling, setCancelling] = useState<Set<string>>(new Set());

  // Fetch based on active tab
  const queryParams =
    activeTab === "all" ? {} :
    activeTab === "cancelled" ? { status: "cancelled" as BookingStatus } :
    { type: activeTab as "upcoming" | "past" };

  const { data, loading, refetch } = useApi(
    () => bookingApi.list(queryParams),
    [activeTab]
  );
  const bookings = data?.bookings ?? [];

  const cancelBooking = async (id: string) => {
    setCancelling(prev => new Set(prev).add(id));
    try {
      await bookingApi.updateStatus(id, { status: "cancelled" });
      toast({ title: "Booking cancelled" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to cancel", variant: "destructive" });
    } finally {
      setCancelling(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-serif font-bold mb-1">My Bookings</h1>
      <p className="text-muted-foreground mb-6">Track and manage your service appointments.</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl mb-6 border w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CalendarDays size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No bookings found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {activeTab === "all"
              ? "Book a service to get started."
              : `No ${activeTab} bookings.`}
          </p>
          {activeTab === "all" && (
            <Link href="/browse">
              <Button className="rounded-full">Browse Vendors</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking: Booking) => {
            const status = statusConfig[booking.status] ?? statusConfig.pending;
            const StatusIcon = status.icon;
            const scheduledDate = new Date(booking.scheduledFor);
            const canCancel = booking.status === "pending";

            return (
              <div key={booking.id} className="bg-card border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{booking.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.notes || "No notes"}
                      </p>
                    </div>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0", status.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {scheduledDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {scheduledDate.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    ID: {booking.id.slice(0, 8)}…
                  </span>
                </div>

                {canCancel && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={cancelling.has(booking.id)}
                      onClick={() => cancelBooking(booking.id)}
                    >
                      {cancelling.has(booking.id)
                        ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Cancelling…</>
                        : "Cancel Booking"
                      }
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
