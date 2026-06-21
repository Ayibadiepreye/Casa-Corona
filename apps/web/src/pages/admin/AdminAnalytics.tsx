import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, ShoppingBag, Star, DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useApi } from "@/hooks/useApi";
import { adminApi } from "@/lib/api-client";
import { formatNaira } from "@/lib/utils";

export default function AdminAnalytics() {
  const { data: stats, loading } = useApi(() => adminApi.getStats());

  const roleData = stats
    ? Object.entries((stats as any).users?.byRole ?? {}).map(([role, count]) => ({ role, count: Number(count) }))
    : [];

  const statusData = stats
    ? Object.entries((stats as any).vendors?.byStatus ?? {}).map(([status, count]) => ({ status, count: Number(count) }))
    : [];

  // Commission widgets
  const totalCommission = Number((stats as any)?.totalCommission ?? 0);
  const totalGmv = Number((stats as any)?.totalGmv ?? 0);
  const completedBookings = Number((stats as any)?.completedBookings ?? 0);
  const monthSubscriptionRevenue = Number((stats as any)?.monthSubscriptionRevenue ?? 0);
  const totalRevenue = totalCommission + monthSubscriptionRevenue;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Real platform stats from Neon DB</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users",    value: loading ? "…" : String((stats as any)?.users?.total ?? 0),    icon: Users },
          { label: "Total Vendors",  value: loading ? "…" : String((stats as any)?.vendors?.total ?? 0),  icon: Store },
          { label: "Total Bookings", value: loading ? "…" : String((stats as any)?.bookings ?? 0),  icon: ShoppingBag },
          { label: "Completed",      value: loading ? "…" : String(completedBookings),            icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-muted-foreground">{label}</span>
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Icon size={14} className="text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Commission + Revenue */}
      <h2 className="font-semibold text-lg mb-3 mt-6">Commission & Revenue</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-green-900 dark:text-green-200 font-medium">Booking Commission</span>
              <DollarSign size={14} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatNaira(totalCommission)}</p>
            <p className="text-[10px] text-green-700 dark:text-green-300 mt-1">From {completedBookings} completed bookings</p>
          </CardContent>
        </Card>
        <Card className="border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-blue-900 dark:text-blue-200 font-medium">Subscriptions (this month)</span>
              <Calendar size={14} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatNaira(monthSubscriptionRevenue)}</p>
            <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-1">Paystack vendor subscriptions</p>
          </CardContent>
        </Card>
        <Card className="border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-purple-900 dark:text-purple-200 font-medium">Total Revenue</span>
              <Wallet size={14} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatNaira(totalRevenue)}</p>
            <p className="text-[10px] text-purple-700 dark:text-purple-300 mt-1">Commission + subscriptions</p>
          </CardContent>
        </Card>
        <Card className="border bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">GMV (all-time)</span>
              <TrendingUp size={14} className="text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{formatNaira(totalGmv)}</p>
            <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">Gross merchandise value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 bg-muted rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={roleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="role" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Vendors by Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 bg-muted rounded-xl animate-pulse" />
            ) : statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No vendor data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
