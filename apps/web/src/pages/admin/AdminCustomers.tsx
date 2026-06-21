import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Users, Loader2, UserX, UserCheck } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export default function AdminCustomers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, loading, refetch } = useApi(() =>
    adminApi.listUsers({ role: "customer", q: search || undefined })
  );
  const customers = data?.users ?? [];
  const total = data?.total ?? 0;

  const suspend = async (id: string, isSuspended: boolean) => {
    setActingId(id);
    try {
      if (isSuspended) {
        await adminApi.unsuspendUser(id);
        toast({ title: "User unsuspended" });
      } else {
        await adminApi.suspendUser(id, "Admin action");
        toast({ title: "User suspended" });
      }
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold">Customer Management</h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage platform customers</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Customers", value: loading ? "…" : total.toLocaleString() },
          { label: "Active", value: loading ? "…" : customers.filter(c => !c.suspended).length },
          { label: "Suspended", value: loading ? "…" : customers.filter(c => c.suspended).length },
        ].map(({ label, value }) => (
          <Card key={label} className="border">
            <CardContent className="p-4">
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-9 rounded-full"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-6 py-3.5 font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">City</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Joined</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                No customers found
              </td></tr>
            ) : customers.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-3.5">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{c.city ?? "—"}</td>
                <td className="px-4 py-3.5 text-muted-foreground text-xs">
                  {new Date(c.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3.5">
                  {c.suspended
                    ? <Badge variant="destructive" className="text-xs">Suspended</Badge>
                    : <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/10 text-xs">Active</Badge>
                  }
                </td>
                <td className="px-4 py-3.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-7 text-xs rounded-full px-3 ${c.suspended ? "text-emerald-600 hover:bg-emerald-50" : "text-destructive hover:bg-destructive/10"}`}
                    disabled={actingId === c.id}
                    onClick={() => suspend(c.id, c.suspended)}
                  >
                    {actingId === c.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : c.suspended
                        ? <><UserCheck size={12} className="mr-1" />Restore</>
                        : <><UserX size={12} className="mr-1" />Suspend</>
                    }
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
