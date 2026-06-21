import { useState } from "react";
import { Heart, Star, MapPin, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useApi } from "@/hooks/useApi";
import { savedApi, vendorApi, SavedVendor } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export default function Saved() {
  const { toast } = useToast();
  const { data, loading, refetch } = useApi(() => savedApi.list());
  const items: SavedVendor[] = data?.saved ?? [];
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const remove = async (vendorId: string) => {
    setRemoving(prev => new Set(prev).add(vendorId));
    try {
      await vendorApi.unsave(vendorId);
      toast({ title: "Removed from saved" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to unsave", variant: "destructive" });
    } finally {
      setRemoving(prev => { const s = new Set(prev); s.delete(vendorId); return s; });
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-serif font-bold mb-1">Saved Businesses</h1>
        <p className="text-muted-foreground mb-8">Businesses you've bookmarked for later.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-1">Saved Businesses</h1>
      <p className="text-muted-foreground mb-8">Businesses you've bookmarked for later.</p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Heart size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No saved businesses yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Businesses you save will appear here.</p>
          <Link href="/browse" className="text-sm text-primary hover:underline font-medium">
            Browse vendors
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(b => (
            <div key={b.id} className="relative group bg-card border rounded-2xl overflow-hidden hover:border-primary/30 transition-all">
              <Link href={`/vendor/${b.slug}`}>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={b.coverUrl || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600"}
                    alt={b.businessName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {b.featured && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">Featured</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {b.city}, {b.state}
                  </p>
                  <p className="font-semibold font-serif">{b.businessName}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    <span className="font-medium">{b.averageRating}</span>
                    <span className="text-muted-foreground">({b.reviewCount})</span>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => remove(b.id)}
                disabled={removing.has(b.id)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-black/60 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 disabled:opacity-50"
                title="Remove from saved"
              >
                {removing.has(b.id)
                  ? <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  : <Heart size={15} className="fill-rose-500 text-rose-500" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
