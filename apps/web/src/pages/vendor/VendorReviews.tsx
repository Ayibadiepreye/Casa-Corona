import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { myVendorApi, vendorReviewApi, VendorReviewFull } from "@/lib/api-client";

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} />
      ))}
    </div>
  );
}

export default function VendorReviews() {
  const { toast } = useToast();
  const { data: vendor } = useApi(() => myVendorApi.get());
  const { data, loading, refetch } = useApi(
    () => vendor?.id ? vendorReviewApi.listForVendor(vendor.id) : Promise.resolve({ reviews: [], total: 0, page: 1, pages: 0 }),
    [vendor?.id]
  );
  const reviews: VendorReviewFull[] = data?.reviews ?? [];
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const submitReply = async (id: string) => {
    const text = replyText[id]?.trim();
    if (!text) return;
    setReplyingId(id);
    try {
      await vendorReviewApi.reply(id, text);
      toast({ title: "Reply posted" });
      setReplyText(p => ({ ...p, [id]: "" }));
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setReplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-serif font-bold mb-6">Reviews</h1>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-serif font-bold mb-1">Reviews</h1>
      <p className="text-muted-foreground mb-6">What your customers are saying.</p>

      {/* Summary */}
      <div className="bg-card border rounded-2xl p-5 mb-6 flex items-center gap-6">
        <div className="text-center shrink-0">
          <p className="text-5xl font-bold font-serif">{avg}</p>
          <Stars n={Math.round(parseFloat(avg))} size={16} />
          <p className="text-xs text-muted-foreground mt-1">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map(n => {
            const count = reviews.filter(r => r.rating === n).length;
            const pct = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2">
                <span className="text-xs w-3">{n}</span>
                <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-4">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Star size={32} className="mx-auto mb-3 opacity-30" />
          <p>No reviews yet. Reviews appear here after customers complete bookings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-card border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                    {r.user.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.user.name}</p>
                    <div className="flex items-center gap-2">
                      <Stars n={r.rating} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {r.content && (
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{r.content}</p>
              )}

              {r.vendorReply ? (
                <div className="bg-muted/60 rounded-xl p-3 border-l-2 border-primary">
                  <p className="text-xs font-semibold text-primary mb-1">Your response</p>
                  <p className="text-sm text-muted-foreground">{r.vendorReply}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write a response to this review…"
                    rows={2}
                    className="resize-none text-sm"
                    value={replyText[r.id] ?? ""}
                    onChange={e => setReplyText(p => ({ ...p, [r.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={replyingId === r.id || !replyText[r.id]?.trim()}
                    onClick={() => submitReply(r.id)}
                  >
                    {replyingId === r.id ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Posting…</> : "Post Reply"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
