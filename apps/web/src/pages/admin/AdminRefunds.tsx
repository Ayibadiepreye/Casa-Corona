import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw, Loader2, Search, X } from "lucide-react";

const API_BASE = () =>
  ((import.meta as any).env?.VITE_API_URL as string) || "http://localhost:5000/api/v1";

type Payment = {
  id: string;
  vendorId: string | null;
  userId: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  paidAt: string | null;
  createdAt: string;
  refundAmount?: number | null;
  refundReason?: string | null;
  refundedAt?: string | null;
};

const formatNaira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

export default function AdminRefunds() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refundModal, setRefundModal] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE()}/payments/payments`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("cc_access_token") || ""}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Failed to load");
      setPayments(json.data.payments || []);
    } catch (e: any) {
      toast({ title: "Failed to load payments", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openRefund = (p: Payment) => {
    setRefundModal(p);
    setRefundAmount("");
    setRefundReason("");
  };

  const closeRefund = () => {
    setRefundModal(null);
  };

  const handleRefund = async () => {
    if (!refundModal) return;
    setSubmitting(true);
    try {
      const body: any = {};
      if (refundAmount.trim()) {
        const amt = parseFloat(refundAmount);
        if (isNaN(amt) || amt <= 0) throw new Error("Enter a valid refund amount in Naira");
        body.amount = amt;
      }
      if (refundReason.trim()) body.reason = refundReason.trim();
      const res = await fetch(`${API_BASE()}/payments/payments/${refundModal.id}/refund`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cc_access_token") || ""}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || `Server returned ${res.status}`);
      }
      toast({
        title: "Refund processed",
        description: body.amount ? `Partial refund of ${formatNaira(body.amount * 100)}` : "Full refund processed",
      });
      closeRefund();
      await load();
    } catch (e: any) {
      toast({ title: "Refund failed", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.reference.toLowerCase().includes(q) || p.status.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
  });

  const statusColor: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    refunded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    partially_refunded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="w-5 h-5" /> Refund Management
          </CardTitle>
          <CardDescription>
            Issue full or partial refunds via Paystack. The vendor will be notified automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, status, or type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading payments…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No payments to show.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Reference</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4 text-right">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">{p.reference}</td>
                      <td className="py-3 pr-4 capitalize">{p.type}</td>
                      <td className="py-3 pr-4 text-right font-medium">{formatNaira(p.amount)}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColor[p.status] || ""}`}>
                          {p.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {p.status === "success" ? (
                          <Button size="sm" variant="outline" onClick={() => openRefund(p)} className="rounded-full">
                            Refund
                          </Button>
                        ) : (p.status === "refunded" || p.status === "partially_refunded") ? (
                          <span className="text-xs text-muted-foreground">
                            {p.refundAmount ? formatNaira(p.refundAmount) : "Full"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Issue refund</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Reference: <code className="text-xs">{refundModal.reference}</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  Original amount: <strong>{formatNaira(refundModal.amount)}</strong>
                </p>
              </div>
              <button onClick={closeRefund} className="p-1 rounded hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Refund amount (₦) — leave blank for full refund</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={refundModal.amount / 100}
                  placeholder={`Max ${formatNaira(refundModal.amount)}`}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Reason (sent to the vendor)</Label>
                <Input
                  placeholder="e.g. Duplicate charge"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={closeRefund} disabled={submitting}>Cancel</Button>
              <Button onClick={handleRefund} disabled={submitting} className="rounded-full">
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {refundAmount ? "Issue partial refund" : "Issue full refund"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}