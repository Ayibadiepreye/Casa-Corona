import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ShoppingBag, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { bookingApi, Booking } from "@/lib/api-client";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    confirmed:  "bg-blue-500/10 text-blue-700 border-blue-200",
    pending:    "bg-amber-500/10 text-amber-700 border-amber-200",
    cancelled:  "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <Badge className={`${map[status] ?? ""} hover:opacity-80 text-xs capitalize`}>
      {status}
    </Badge>
  );
};

export default function AdminBookings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all bookings without limit
  const { data, loading, refetch } = useApi(() => bookingApi.list({ limit: 1000 }));
  const bookings: Booking[] = data?.bookings ?? [];

  const filtered = bookings.filter(b => {
    const matchesSearch = b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.id.includes(search);
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    total:     bookings.length,
    completed: bookings.filter(b => b.status === "completed").length,
    pending:   bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold">Bookings</h1>
        <p className="text-muted-foreground text-sm mt-1">All platform bookings</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total",     value: loading ? "…" : counts.total,     color: "text-foreground", filter: "all" },
          { label: "Completed", value: loading ? "…" : counts.completed,  color: "text-emerald-600", filter: "completed" },
          { label: "Confirmed", value: loading ? "…" : counts.confirmed,  color: "text-blue-600", filter: "confirmed" },
          { label: "Pending",   value: loading ? "…" : counts.pending,    color: "text-amber-600", filter: "pending" },
          { label: "Cancelled", value: loading ? "…" : counts.cancelled,  color: "text-destructive", filter: "cancelled" },
        ].map(({ label, value, color, filter }) => (
          <Card 
            key={label} 
            className={`border cursor-pointer transition-all hover:border-primary ${statusFilter === filter ? "border-primary bg-primary/5" : ""}`}
            onClick={() => setStatusFilter(filter)}
          >
            <CardContent className="p-4">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bookings..."
          className="pl-9 rounded-full"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-6 py-3.5 font-medium text-muted-foreground">ID</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Scheduled</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                No bookings found
              </td></tr>
            ) : filtered.map(b => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-3.5">
                  <span className="font-mono text-xs text-muted-foreground">{b.id.slice(0, 8)}…</span>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-medium">{b.customerName}</p>
                  <p className="text-xs text-muted-foreground">{b.customerEmail}</p>
                </td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">
                  {new Date(b.scheduledFor).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  {" "}
                  {new Date(b.scheduledFor).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3.5">{statusBadge(b.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
