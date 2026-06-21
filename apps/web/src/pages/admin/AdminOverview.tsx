import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, Store, ShoppingBag, Bell, CheckCircle, Clock,
  AlertTriangle, Activity, DollarSign, Star, Shield
} from "lucide-react";
import { Link } from "wouter";
import { useApi } from "@/hooks/useApi";
import { adminApi, vendorApi } from "@/lib/api-client";

export default function AdminOverview() {
  const { data: stats, loading: statsLoading } = useApi(() => adminApi.getStats());
  const { data: vendorsData, loading: vendorsLoading } = useApi(() =>
    adminApi.listVendors({ limit: 5 })
  );

  const vendors = vendorsData?.vendors ?? [];
  const customerCount = stats?.users?.byRole?.customer ?? 0;
  const vendorCount = stats?.vendors?.total ?? 0;
  const bookingCount = stats?.bookings ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold">Admin Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform health at a glance</p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-destructive border-destructive/30 bg-destructive/5">
          <Shield size={12} />
          Admin Mode
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
          ))
        ) : (
          [
            { label: "Total Vendors", value: vendorCount.toLocaleString(), icon: Store, sub: `${Object.values(stats?.vendors?.byStatus ?? {}).join(", ")}` },
            { label: "Total Customers", value: customerCount.toLocaleString(), icon: Users, sub: `${stats?.users?.total ?? 0} total users` },
            { label: "Total Bookings", value: bookingCount.toLocaleString(), icon: ShoppingBag, sub: "All time" },
            { label: "Total Reviews", value: (stats?.reviews ?? 0).toLocaleString(), icon: Star, sub: "All time" },
          ].map(({ label, value, icon: Icon, sub }) => (
            <Card key={label} className="border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">{label}</span>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon size={16} className="text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold font-serif mb-1">{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent vendors table */}
        <Card className="xl:col-span-2 border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Vendors</CardTitle>
              <Button variant="outline" size="sm" className="rounded-full text-xs h-8" asChild>
                <Link href="/admin/vendors">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {vendorsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Business</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Verified</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm">No vendors yet</td>
                      </tr>
                    ) : vendors.map(v => (
                      <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3">
                          <div>
                            <p className="font-medium truncate max-w-[160px]">{v.businessName}</p>
                            <p className="text-xs text-muted-foreground">{v.city}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${v.subscriptionStatus === "active" ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                            {v.subscriptionStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {v.verified ? (
                            <CheckCircle size={14} className="text-emerald-600" />
                          ) : (
                            <span className="text-xs text-muted-foreground">Unverified</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium">{v.averageRating ?? "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              User Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              Object.entries(stats?.users?.byRole ?? {}).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{role}</span>
                  <span className="font-bold text-sm">{String(count)}</span>
                </div>
              ))
            )}
            <div className="pt-2 border-t">
              <Link href="/admin/vendors" className="text-xs text-primary hover:underline">
                Manage vendors →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
