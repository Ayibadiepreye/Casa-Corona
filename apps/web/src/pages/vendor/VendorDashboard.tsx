import { Eye, MessageSquare, Star, Users, TrendingUp, AlertCircle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useApi } from "@/hooks/useApi";
import { myVendorApi, bookingApi, conversationApi, vendorReviewApi, analyticsApi, vendorApi } from "@/lib/api-client";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} className={i <= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} />
      ))}
    </div>
  );
}

export default function VendorDashboard() {
  const { user } = useAuth();

  const { data: vendor } = useApi(() => myVendorApi.get());
  const { data: bookingsData } = useApi(() => bookingApi.list({ limit: 5, type: "upcoming" }));
  const { data: convoData } = useApi(() => conversationApi.list());
  const { data: analytics } = useApi(() => analyticsApi.getVendorAnalytics());
  // Real 7-day view chart from vendor_views table
  const { data: viewStats } = useApi(
    () => vendor?.id ? vendorApi.getViewStats(vendor.id) : Promise.resolve({ totalViews: 0, last7Days: 0, byDay: [] }),
    [vendor?.id]
  );

  const { data: reviewsData } = useApi(
    () => vendor?.id ? vendorReviewApi.listForVendor(vendor.id) : Promise.resolve({ reviews: [], total: 0, page: 1, pages: 0 }),
    [vendor?.id]
  );

  const upcomingBookings = bookingsData?.bookings ?? [];
  const conversations = convoData?.conversations ?? [];
  const recentConvos = conversations.slice(0, 3);
  const recentReviews = reviewsData?.reviews?.slice(0, 2) ?? [];

  // Use real 7-day chart if available, else fallback
  const chartData = viewStats?.byDay?.length
    ? viewStats.byDay.map(d => ({
        day: new Date(d.day).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
        views: d.count,
      }))
    : [{ day: "—", views: viewStats?.totalViews ?? 0 }];

  const subStatus = vendor?.subscriptionStatus ?? "inactive";
  const subExpiry = vendor?.subscriptionExpiresAt;
  const daysUntilExpiry = subExpiry
    ? Math.ceil((new Date(subExpiry).getTime() - Date.now()) / 86400000)
    : null;
  const showExpiryAlert = daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold mb-1">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          {vendor ? `${vendor.businessName} · ${vendor.city}` : "Loading your listing…"}
        </p>
      </div>

      {showExpiryAlert && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your subscription expires in <strong>{daysUntilExpiry} days</strong>.{" "}
            <Link href="/vendor/payments" className="underline font-semibold">Renew now</Link> to keep your listing active.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Profile Views", value: String(vendor?.totalViews ?? analytics?.profileViews ?? 0), sub: "All time", icon: Eye, change: null },
          { label: "Messages", value: String(conversations.reduce((s, c) => s + (c.vendorUnread ?? 0), 0)), sub: `${conversations.length} total conversations`, icon: MessageSquare, change: null },
          { label: "Reviews", value: String(vendor?.reviewCount ?? 0), sub: `Avg ${vendor?.averageRating ?? 0} stars`, icon: Star, change: null },
          { label: "Followers", value: String(vendor?.totalFollowers ?? 0), sub: `${vendor?.totalSaves ?? 0} saves`, icon: Users, change: null },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-card border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <Icon size={18} className="text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Views chart */}
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold">Profile Views</h2>
            <TrendingUp size={18} className="text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription */}
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Subscription</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">{subStatus === "active" ? "Standard" : "Free"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className={`font-medium ${subStatus === "active" ? "text-emerald-600" : "text-muted-foreground"}`}>
                {subStatus === "active" ? "Active" : "Inactive"}
              </span>
            </div>
            {subExpiry && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-medium text-amber-600">
                  {new Date(subExpiry).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Featured</span>
              <span className={`font-medium ${vendor?.featured ? "text-amber-500" : "text-muted-foreground"}`}>
                {vendor?.featured ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <Button asChild className="w-full rounded-full bg-amber-500 hover:bg-amber-600 text-white">
            <Link href="/vendor/payments">Manage Subscription</Link>
          </Button>
        </div>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Bookings</h2>
            <Link href="/vendor/bookings" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {upcomingBookings.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <CalendarDays size={15} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.scheduledFor).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                    {" · "}
                    {new Date(b.scheduledFor).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full capitalize">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Messages</h2>
            <Link href="/vendor/messages" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {recentConvos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No conversations yet.</p>
          ) : (
            <div className="space-y-3">
              {recentConvos.map(c => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                    {(c.customer?.name?.[0] ?? "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">{c.customer?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.lastMessageAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.lastMessage?.content ?? "No messages yet"}
                    </p>
                  </div>
                  {c.vendorUnread > 0 && (
                    <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold shrink-0">
                      {c.vendorUnread}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Reviews</h2>
            <Link href="/vendor/reviews" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {recentReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {recentReviews.map(r => (
                <div key={r.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{r.user.name}</p>
                    <Stars n={r.rating} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {r.content ?? "No comment"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
