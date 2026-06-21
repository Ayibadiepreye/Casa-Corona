import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { History, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE = () =>
  ((import.meta as any).env?.VITE_API_URL as string) || "http://localhost:5000/api/v1";

type AuditEntry = {
  id: string;
  actorId: string | null;
  actorName?: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  changes: any;
  ipAddress: string | null;
  createdAt: string;
};

export default function AdminAuditLog() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState<string>("all");
  const [action, setAction] = useState<string>("all");

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (resourceType !== "all") params.set("resourceType", resourceType);
      if (action !== "all") params.set("action", action);
      const res = await fetch(`${API_BASE()}/admin/audit-logs?${params}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("cc_access_token") || ""}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Failed to load");
      const d = json.data || {};
      setEntries(d.entries || d.logs || d.auditLogs || []);
      setTotal(d.total ?? d.count ?? (d.entries || []).length);
    } catch (e: any) {
      toast({ title: "Failed to load audit log", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, resourceType, action]);

  const actionColor = (a: string) => {
    if (a.includes("delete") || a.includes("reject") || a.includes("suspend")) return "destructive";
    if (a.includes("create") || a.includes("approve")) return "default";
    if (a.includes("update") || a.includes("edit") || a.includes("patch")) return "secondary";
    return "outline";
  };

  const uniqueActions = Array.from(new Set(entries.map((e) => e.action))).sort();
  const uniqueResources = Array.from(new Set(entries.map((e) => e.resourceType))).sort();

  return (
    <div className="space-y-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" /> Audit Log
          </CardTitle>
          <CardDescription>
            Every admin action is recorded here. Use filters to find specific events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search actions or resource IDs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
                className="pl-9"
              />
            </div>
            <Select value={resourceType} onValueChange={(v) => { setResourceType(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Resource type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All resources</SelectItem>
                {uniqueResources.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {uniqueActions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No audit entries to show.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 whitespace-nowrap">When</th>
                      <th className="py-2 pr-4">Actor</th>
                      <th className="py-2 pr-4">Action</th>
                      <th className="py-2 pr-4">Resource</th>
                      <th className="py-2 pr-4 hidden md:table-cell">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(e.createdAt).toLocaleString("en-NG", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 pr-4 text-xs">
                          {e.actorName || (e.actorId ? e.actorId.slice(0, 8) : <span className="text-muted-foreground">system</span>)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={actionColor(e.action) as any} className="text-[10px]">{e.action}</Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs font-medium">{e.resourceType}</span>
                          {e.resourceId && (
                            <p className="text-[10px] text-muted-foreground font-mono">{e.resourceId.slice(0, 12)}…</p>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-muted-foreground hidden md:table-cell">{e.ipAddress || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>{total} total · page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}