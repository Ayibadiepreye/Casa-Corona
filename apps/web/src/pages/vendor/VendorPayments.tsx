import { useState, useMemo, useEffect } from "react";
import { Receipt, Loader2, ExternalLink, Crown, CheckCircle2, XCircle, Clock, Sparkles, AlertTriangle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { paymentApi, Plan, myVendorApi } from "@/lib/api-client";
import { formatNaira } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";

type Status = "active" | "expired" | "cancelled" | "pending";

export default function VendorPayments() {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Backend lives — strip mock data and load real ones
  const { data: plansData } = useApi<{ plans: Plan[] }>(() => paymentApi.plans(), []);
  const { data: subsData, refetch: refetchSubs } = useApi<any>(
    () => paymentApi.mySubscriptions(),
    []
  );
  const { data: vendor, refetch: refetchVendor } = useApi(() => myVendorApi.get(), []);

  const plans: Plan[] = plansData?.plans ?? [];
  const subs: any[] = Array.isArray(subsData) ? subsData : subsData?.subscriptions ?? subsData?.data ?? [];

  // Handle payment callback from Paystack
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    const status = params.get('status');
    
    if (reference && status === 'success' && !verifying) {
      setVerifying(true);
      paymentApi.verify(reference)
        .then(() => {
          toast({ 
            title: "Payment successful!", 
            description: "Your subscription has been activated." 
          });
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          // Refresh data
          refetchVendor();
          refetchSubs();
        })
        .catch((e: any) => {
          toast({ 
            title: "Payment verification failed", 
            description: e.message, 
            variant: "destructive" 
          });
        })
        .finally(() => {
          setVerifying(false);
        });
    }
  }, []);

  // Calculate days until expiry
  const daysUntilExpiry = useMemo(() => {
    if (!vendor?.subscriptionExpiresAt) return null;
    const days = differenceInDays(new Date(vendor.subscriptionExpiresAt), new Date());
    return days > 0 ? days : 0;
  }, [vendor?.subscriptionExpiresAt]);

  // Calculate days until featured expires
  const daysUntilFeaturedExpiry = useMemo(() => {
    if (!vendor?.featuredUntil) return null;
    const days = differenceInDays(new Date(vendor.featuredUntil), new Date());
    return days > 0 ? days : 0;
  }, [vendor?.featuredUntil]);

  const handleSubscribe = async (planId: string) => {
    setBusy(planId);
    try {
      const { authorizationUrl } = await paymentApi.subscribe(planId as Plan["id"]);
      // Redirect to Paystack checkout
      window.location.href = authorizationUrl;
    } catch (e: any) {
      toast({ title: "Subscribe failed", description: e.message, variant: "destructive" });
      setBusy(null);
    }
  };

  const handleFeaturedSubscribe = async () => {
    setBusy("featured");
    try {
      // Call backend with type: "featured"
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/payments/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cc_access_token")}`,
        },
        credentials: "include",
        body: JSON.stringify({ type: "featured", plan: "monthly" }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to initialize payment");
      }
      
      const data = await response.json();
      window.location.href = data.data.authorizationUrl;
    } catch (e: any) {
      toast({ title: "Subscribe failed", description: e.message, variant: "destructive" });
      setBusy(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this subscription? It will remain active until expiry.")) return;
    setBusy(id);
    try {
      await paymentApi.cancel(id);
      await refetchSubs();
      toast({ title: "Subscription cancelled" });
    } catch (e: any) {
      toast({ title: "Cancel failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold mb-1">Subscription & Payments</h1>
        <p className="text-muted-foreground">Choose a plan to keep your vendor profile visible on Casa Corona.</p>
      </div>

      {/* Subscription Status Card */}
      {vendor && daysUntilExpiry !== null && (
        <Card className={daysUntilExpiry <= 7 ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : "border-green-500 bg-green-50 dark:bg-green-950/20"}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${daysUntilExpiry <= 7 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-green-100 dark:bg-green-900/30"}`}>
                  {daysUntilExpiry <= 7 ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-green-600" />}
                </div>
                <div>
                  <h3 className={`font-semibold mb-1 ${daysUntilExpiry <= 7 ? "text-amber-900 dark:text-amber-100" : "text-green-900 dark:text-green-100"}`}>
                    {vendor.subscriptionStatus === "active" ? "Subscription Active" : "Subscription Expired"}
                  </h3>
                  <p className={`text-sm ${daysUntilExpiry <= 7 ? "text-amber-800 dark:text-amber-200" : "text-green-800 dark:text-green-200"}`}>
                    {daysUntilExpiry > 0 && vendor.subscriptionExpiresAt ? (
                      <>
                        <strong>{daysUntilExpiry} days</strong> remaining until {format(new Date(vendor.subscriptionExpiresAt), "MMM d, yyyy")}
                      </>
                    ) : (
                      "Your subscription has expired"
                    )}
                  </p>
                  {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Renew soon to avoid your listing becoming inactive
                    </p>
                  )}
                </div>
              </div>
              {daysUntilExpiry > 0 && (
                <Badge variant="outline" className="shrink-0">
                  <CalendarDays className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Status Card */}
      {vendor?.featured && daysUntilFeaturedExpiry !== null && (
        <Card className="border-purple-500 bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-purple-900 dark:text-purple-100">Featured Listing Active</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  {daysUntilFeaturedExpiry > 0 && vendor.featuredUntil ? (
                    <>
                      <strong>{daysUntilFeaturedExpiry} days</strong> remaining until {format(new Date(vendor.featuredUntil), "MMM d, yyyy")}
                    </>
                  ) : (
                    "Your featured listing has expired"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active subscriptions */}
      {subs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Your subscriptions</h2>
          <div className="space-y-3">
            {subs.map((s: any) => {
              const status = s.status as Status;
              const StatusIcon = status === "active" ? CheckCircle2 : status === "expired" ? Clock : XCircle;
              const daysLeft = differenceInDays(new Date(s.expiresAt), new Date());
              return (
                <div key={s.id} className="flex items-center justify-between bg-card border rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium capitalize">{s.plan}</p>
                      <p className="text-xs text-muted-foreground">
                        {status === "active" ? "Expires" : "Expired"}: {new Date(s.expiresAt).toLocaleDateString()}
                        {status === "active" && daysLeft > 0 && ` (${daysLeft} days left)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={status === "active" ? "default" : "secondary"} className="flex items-center gap-1">
                      <StatusIcon className="w-3 h-3" />
                      {status}
                    </Badge>
                    {status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === s.id}
                        onClick={() => handleCancel(s.id)}
                      >
                        {busy === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Cancel"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Plan picker */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          {vendor?.subscriptionStatus === "active" && daysUntilExpiry && daysUntilExpiry > 0 
            ? "Extend or Upgrade" 
            : "Choose a plan"}
        </h2>
        {vendor?.subscriptionStatus === "active" && daysUntilExpiry && daysUntilExpiry > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            Pay early to extend your subscription time (months will be added to your current expiry date)
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-card border rounded-2xl p-5 flex flex-col hover:border-primary/50 transition"
            >
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-lg">{p.name}</h3>
              </div>
              <p className="text-3xl font-bold mb-1">{formatNaira(p.amountNgn)}</p>
              <p className="text-xs text-muted-foreground mb-4 capitalize">{p.interval}</p>
              <ul className="text-sm space-y-1.5 mb-5 flex-1 text-muted-foreground">
                <li>• Verified badge on profile</li>
                <li>• Unlimited bookings</li>
                <li>• Customer chat & messaging</li>
                <li>• Analytics dashboard</li>
              </ul>
              <Button
                onClick={() => handleSubscribe(p.id)}
                disabled={busy === p.id}
                className="w-full rounded-full"
              >
                {busy === p.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    Pay with Paystack <ExternalLink className="w-3 h-3 ml-2" />
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Secure payment powered by Paystack. All plans auto-renew unless cancelled.
        </p>
      </section>

      {/* Featured Listing Section */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Featured Listing
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Boost your visibility and appear at the top of search results and category pages
        </p>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-purple-900 dark:text-purple-100 mb-1">Featured Listing Plan</h3>
              <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">Stand out from competitors and get 3x more profile views</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">₦25,000<span className="text-base font-normal text-purple-700 dark:text-purple-300">/month</span></p>
            </div>
            <div className="w-16 h-16 rounded-full bg-purple-200 dark:bg-purple-900/50 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <ul className="text-sm space-y-2 mb-5 text-purple-900 dark:text-purple-100">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              Top placement in search results
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              Priority in category browse pages
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              Featured badge on your profile
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              3x more visibility than regular listings
            </li>
          </ul>
          <Button
            onClick={handleFeaturedSubscribe}
            disabled={busy === "featured"}
            className="w-full rounded-full bg-purple-600 hover:bg-purple-700"
          >
            {busy === "featured" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Redirecting…
              </>
            ) : (
              <>
                Subscribe to Featured <ExternalLink className="w-3 h-3 ml-2" />
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Commission Invoices Section */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-600" />
          Commission Invoices
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Monthly invoices for completed bookings (10% platform commission). Invoices are generated on the 1st of each month.
        </p>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commission Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <CommissionInvoicesTable />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// Commission Invoices Table Component
function CommissionInvoicesTable() {
  const { toast } = useToast();
  const { data: paymentsData, loading, refetch } = useApi<any>(
    () => fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/payments/payments?type=commission`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${localStorage.getItem("cc_access_token")}` }
    }).then(r => r.json()),
    []
  );

  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);

  const invoices = paymentsData?.payments?.filter((p: any) => p.type === "commission") ?? [];

  const handlePayInvoice = async (invoice: any) => {
    setPayingInvoice(invoice.id);
    try {
      // Initialize Paystack payment for commission
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/payments/commission/${invoice.id}/pay`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cc_access_token")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to initialize payment");
      }
      
      const data = await response.json();
      window.location.href = data.data.authorizationUrl;
    } catch (e: any) {
      toast({ title: "Payment failed", description: e.message, variant: "destructive" });
      setPayingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No commission invoices yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Invoices are generated monthly when you complete bookings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice: any) => {
        const isPending = invoice.status === "pending";
        const bookingsCount = invoice.paystackData?.bookings ?? 0;
        
        return (
          <div key={invoice.id} className={`border rounded-xl p-4 ${isPending ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200" : "bg-card"}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPending ? "bg-amber-100" : "bg-green-100"}`}>
                  <Receipt className={`w-5 h-5 ${isPending ? "text-amber-600" : "text-green-600"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">Commission Invoice</h4>
                    <Badge variant={isPending ? "default" : "secondary"} className="text-xs">
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Reference: <span className="font-mono text-xs">{invoice.reference}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bookingsCount} completed bookings • Generated {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                  </p>
                  {invoice.paystackData?.period && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Period: {format(new Date(invoice.paystackData.period.from), "MMM d")} - {format(new Date(invoice.paystackData.period.to), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatNaira(invoice.amount / 100)}</p>
                {isPending && (
                  <Button
                    size="sm"
                    className="mt-2 rounded-full"
                    onClick={() => handlePayInvoice(invoice)}
                    disabled={payingInvoice === invoice.id}
                  >
                    {payingInvoice === invoice.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                        Processing…
                      </>
                    ) : (
                      <>Pay Now</>
                    )}
                  </Button>
                )}
                {!isPending && invoice.paidAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Paid {format(new Date(invoice.paidAt), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}