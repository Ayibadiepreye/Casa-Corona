import { useState } from "react";
import { Users, MapPin, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useApi } from "@/hooks/useApi";
import { followApi, vendorApi, FollowedVendor } from "@/lib/api-client";

export default function Following() {
  const { toast } = useToast();
  const { data, loading, refetch } = useApi(() => followApi.list());
  const follows: FollowedVendor[] = data?.follows ?? [];
  const [unfollowing, setUnfollowing] = useState<Set<string>>(new Set());

  const unfollow = async (vendorId: string) => {
    setUnfollowing(prev => new Set(prev).add(vendorId));
    try {
      await vendorApi.unfollow(vendorId);
      toast({ title: "Unfollowed" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to unfollow", variant: "destructive" });
    } finally {
      setUnfollowing(prev => { const s = new Set(prev); s.delete(vendorId); return s; });
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-serif font-bold mb-1">Following</h1>
        <p className="text-muted-foreground mb-8">Businesses you follow for updates.</p>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-1">Following</h1>
      <p className="text-muted-foreground mb-8">Businesses you follow for updates.</p>

      {follows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Not following anyone yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Follow businesses to see their updates here.</p>
          <Link href="/browse" className="text-sm text-primary hover:underline font-medium">
            Discover vendors
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {follows.map(b => (
            <div key={b.id} className="bg-card border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted border">
                <img
                  src={b.logoUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200"}
                  alt={b.businessName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/vendor/${b.slug}`} className="font-semibold hover:text-primary transition-colors truncate block">
                  {b.businessName}
                </Link>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {b.city}, {b.state}
                </p>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  <span>{b.averageRating}</span>
                  <span>({b.reviewCount} reviews)</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full shrink-0"
                disabled={unfollowing.has(b.id)}
                onClick={() => unfollow(b.id)}
              >
                {unfollowing.has(b.id)
                  ? <Loader2 size={14} className="animate-spin" />
                  : "Unfollow"
                }
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
