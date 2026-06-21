import { useState } from "react";
import { Star, Trash2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { reviewApi, MyReview } from "@/lib/api-client";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14} className={i <= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} />
      ))}
    </div>
  );
}

export default function MyReviews() {
  const { toast } = useToast();
  const { data, loading, refetch } = useApi(() => reviewApi.listMine());
  const reviews: MyReview[] = data ?? [];
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  const remove = async (id: string) => {
    setDeleting(prev => new Set(prev).add(id));
    try {
      await reviewApi.delete(id);
      toast({ title: "Review deleted" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-serif font-bold mb-1">My Reviews</h1>
        <p className="text-muted-foreground mb-8">Reviews you've written for businesses.</p>
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
      <h1 className="text-2xl font-serif font-bold mb-1">My Reviews</h1>
      <p className="text-muted-foreground mb-8">Reviews you've written for businesses.</p>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Star size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No reviews yet</h3>
          <p className="text-muted-foreground text-sm">
            Reviews you write appear here. You can only review vendors after completing a booking.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r: MyReview) => (
            <div key={r.id} className="bg-card border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-sm text-muted-foreground font-mono">{r.vendorId.slice(0, 8)}…</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Stars n={r.rating} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10 shrink-0"
                  disabled={deleting.has(r.id)}
                  onClick={() => remove(r.id)}
                >
                  {deleting.has(r.id)
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Trash2 size={14} />
                  }
                </Button>
              </div>

              {r.content && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{r.content}</p>
              )}

              {r.vendorReply && (
                <div className="bg-muted/40 border rounded-xl p-3 mt-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Vendor Reply
                    {r.vendorReplyAt && (
                      <span className="font-normal ml-1">
                        · {new Date(r.vendorReplyAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{r.vendorReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
