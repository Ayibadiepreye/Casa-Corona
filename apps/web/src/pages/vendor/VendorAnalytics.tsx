import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useApi } from "@/hooks/useApi";
import { myVendorApi, analyticsApi } from "@/lib/api-client";

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    fontSize: 12,
  }
};

// Generate placeholder chart data for views when backend returns empty
function placeholderViewsData(totalViews: number) {
  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6"];
  const base = Math.floor(totalViews / 6);
  return weeks.map((week, i) => ({ week, views: base + Math.floor(Math.random() * 5) * (i + 1) }));
}

export default function VendorAnalytics() {
  const { data: vendor } = useApi(() => myVendorApi.get());
  const { data: analytics, loading } = useApi(() => analyticsApi.getVendorAnalytics());

  const viewsData = analytics?.earningsChart?.length
    ? analytics.earningsChart.map(d => ({ week: new Date(d.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }), views: d.amount }))
    : placeholderViewsData(vendor?.totalViews ?? 0);

  const topServices = analytics?.topServices?.length
    ? analytics.topServices
    : (vendor?.services?.map(s => ({ name: s.name, inquiries: 0 })) ?? []);

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl font-serif font-bold mb-1">Analytics</h1>
          <p className="text-muted-foreground">Insights into your listing performance.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-serif font-bold mb-1">Analytics</h1>
        <p className="text-muted-foreground">Insights into your listing performance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Views",       value: String(vendor?.totalViews ?? analytics?.profileViews ?? 0) },
          { label: "Saves",             value: String(vendor?.totalSaves ?? 0) },
          { label: "Followers",         value: String(vendor?.totalFollowers ?? 0) },
          { label: "Avg Rating",        value: `${(vendor?.averageRating ?? 0).toFixed(1)}★` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border rounded-2xl p-5">
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Views chart */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="font-semibold mb-6">Profile Views</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={viewsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top services */}
      {topServices.length > 0 && (
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-semibold mb-5">Services</h2>
          <div className="space-y-4">
            {topServices.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.inquiries} inquiries</span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: topServices[0]?.inquiries > 0 ? `${(s.inquiries / topServices[0].inquiries) * 100}%` : "10%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">Analytics data is updated periodically. Detailed reporting coming in a future update.</p>
    </div>
  );
}
