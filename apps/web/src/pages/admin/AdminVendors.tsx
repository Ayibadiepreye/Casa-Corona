import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Store, CheckCircle, Loader2, ShieldOff, Star, StarOff, XCircle } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

type ActionType = "verify" | "unverify" | "feature" | "unfeature" | "suspend";

interface PendingAction {
  id: string;
  type: ActionType;
  businessName: string;
}

export default function AdminVendors() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [actingId, setActingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const { data, loading, refetch } = useApi(() =>
    adminApi.listVendors({ q: search || undefined })
  );
  const vendors = data?.vendors ?? [];

  const filtered = vendors.filter(v => {
    if (filter === "active") return v.verified;
    if (filter === "inactive") return !v.verified;
    return true;
  });

  const counts = {
    all: vendors.length,
    active: vendors.filter(v => v.verified).length,
    inactive: vendors.filter(v => !v.verified).length,
  };

  const confirmAction = (id: string, type: ActionType, businessName: string) => {
    setPendingAction({ id, type, businessName });
  };

  const executeAction = async () => {
    if (!pendingAction) return;
    const { id, type } = pendingAction;
    setActingId(id);
    setPendingAction(null);
    try {
      switch (type) {
        case "verify":
          await adminApi.bulkApproveVendors([id]);
          toast({ title: "Vendor verified successfully" });
          break;
        case "unverify":
          await adminApi.updateVendor(id, { verified: false });
          toast({ title: "Vendor unverified" });
          break;
        case "feature":
          await adminApi.updateVendor(id, { featured: true });
          toast({ title: "Vendor featured" });
          break;
        case "unfeature":
          await adminApi.updateVendor(id, { featured: false });
          toast({ title: "Vendor removed from featured" });
          break;
        case "suspend":
          await adminApi.suspendVendor(id, "Suspended by admin");
          toast({ title: "Vendor suspended and removed from listings" });
          break;
      }
      refetch();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const actionLabel = (type: ActionType) => {
    switch (type) {
      case "verify": return "verify this vendor";
      case "unverify": return "remove verification from this vendor";
      case "feature": return "feature this vendor";
      case "unfeature": return "remove this vendor from featured";
      case "suspend": return "suspend and remove this vendor";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold">Vendor Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Review, approve, and manage all vendor listings</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {(["all", "active", "inactive"] as const).map(s => (
          <Card
            key={s}
            className={`cursor-pointer border transition-all ${filter === s ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
            onClick={() => setFilter(s)}
          >
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold">{loading ? "…" : counts[s]}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {s === "all" ? "All" : s === "active" ? "Verified" : "Unverified"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          className="pl-9 rounded-full"
          value={search}
          onChange={e => { setSearch(e.target.value); refetch(); }}
        />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-6 py-3.5 font-medium text-muted-foreground">Business</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Verified</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Featured</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Rating</th>
              <th className="text-left px-4 py-3.5 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <Store size={32} className="mx-auto mb-2 opacity-30" />
                  No vendors found
                </td>
              </tr>
            ) : filtered.map(v => (
              <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    {v.logoUrl && (
                      <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden shrink-0">
                        <img src={v.logoUrl} alt={v.businessName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{v.businessName}</p>
                      <p className="text-xs text-muted-foreground">{v.city}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Badge className={`text-xs ${v.subscriptionStatus === "active"
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                    : "bg-muted text-muted-foreground border-0"}`}>
                    {v.subscriptionStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  {v.verified
                    ? <CheckCircle size={15} className="text-emerald-600" />
                    : <span className="text-xs text-amber-600 font-medium">Pending</span>
                  }
                </td>
                <td className="px-4 py-3.5">
                  {v.featured
                    ? <Star size={15} className="text-yellow-500 fill-yellow-500" />
                    : <span className="text-xs text-muted-foreground">—</span>
                  }
                </td>
                <td className="px-4 py-3.5 text-sm">{v.averageRating ?? "—"}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    {!v.verified ? (
                      <Button
                        size="sm"
                        className="h-7 text-xs rounded-full px-3"
                        disabled={actingId === v.id}
                        onClick={() => confirmAction(v.id, "verify", v.businessName)}
                      >
                        {actingId === v.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} className="mr-1" />}
                        Verify
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-full px-3 text-amber-600 border-amber-200 hover:bg-amber-50"
                        disabled={actingId === v.id}
                        onClick={() => confirmAction(v.id, "unverify", v.businessName)}
                      >
                        <ShieldOff size={12} className="mr-1" />
                        Unverify
                      </Button>
                    )}

                    {!v.featured ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-full px-3"
                        disabled={actingId === v.id}
                        onClick={() => confirmAction(v.id, "feature", v.businessName)}
                      >
                        <Star size={12} className="mr-1" />
                        Feature
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-full px-3"
                        disabled={actingId === v.id}
                        onClick={() => confirmAction(v.id, "unfeature", v.businessName)}
                      >
                        <StarOff size={12} className="mr-1" />
                        Unfeature
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs rounded-full px-3 text-destructive hover:bg-destructive/10"
                      disabled={actingId === v.id}
                      onClick={() => confirmAction(v.id, "suspend", v.businessName)}
                    >
                      <XCircle size={12} className="mr-1" />
                      Remove
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              <strong>{pendingAction ? actionLabel(pendingAction.type) : ""}</strong>?
              {pendingAction?.type === "suspend" && (
                <span className="block mt-2 text-destructive font-medium">
                  This will remove "{pendingAction.businessName}" from all listings. This action cannot be easily undone.
                </span>
              )}
              {pendingAction?.type !== "suspend" && (
                <span className="block mt-1">
                  Vendor: <strong>{pendingAction?.businessName}</strong>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={pendingAction?.type === "suspend" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
