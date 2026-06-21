import { useRef, useState } from "react";
import { Upload, Trash2, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { myVendorApi, portfolioApi } from "@/lib/api-client";
import type { VendorPortfolio } from "@/lib/api-client";

const MAX = 20;

export default function VendorPortfolio() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: vendor } = useApi(() => myVendorApi.get());
  const { data, loading, refetch } = useApi(
    () => vendor?.id ? portfolioApi.list(vendor.id) : Promise.resolve({ portfolioShots: [], total: 0, page: 1, pages: 0 }),
    [vendor?.id]
  );
  const photos: VendorPortfolio[] = data?.portfolioShots ?? [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vendor) return;
    if (photos.length >= MAX) {
      toast({ title: "Portfolio full", description: `You can only upload ${MAX} photos.`, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      await portfolioApi.upload(vendor.id, file, caption.trim() || undefined);
      toast({ title: "Photo uploaded" });
      setCaption("");
      refetch();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await portfolioApi.delete(id);
      toast({ title: "Photo removed" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold mb-1">Portfolio</h1>
          <p className="text-muted-foreground">Showcase your best work to potential clients.</p>
        </div>
        <span className="text-sm text-muted-foreground">{photos.length}/{MAX} photos</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-6">
        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(photos.length / MAX) * 100}%` }} />
      </div>

      {/* Upload area */}
      <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <Input
            placeholder="Caption (optional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="h-10 bg-background"
            disabled={uploading}
          />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <Button
          className="rounded-full gap-2 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || photos.length >= MAX || !vendor}
        >
          {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Upload size={16} /> Upload Photo</>}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-2xl text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Image size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No photos yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Upload photos of your work to attract clients.</p>
          <Button className="rounded-full gap-2" onClick={() => fileInputRef.current?.click()} disabled={!vendor}>
            <Upload size={16} /> Upload Photos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map(p => (
            <div key={p.id} className="group relative aspect-square">
              <img src={p.imageUrl} alt={p.caption ?? "Portfolio"} className="w-full h-full object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-2xl flex flex-col items-center justify-center gap-2">
                {p.caption && (
                  <p className="opacity-0 group-hover:opacity-100 text-white text-xs px-2 text-center line-clamp-2 transition-opacity">{p.caption}</p>
                )}
                <button
                  onClick={() => remove(p.id)}
                  disabled={deletingId === p.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-destructive hover:text-white disabled:opacity-50"
                >
                  {deletingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))}
          {photos.length < MAX && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!vendor}
              className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
            >
              <Upload size={20} className="text-muted-foreground group-hover:text-primary" />
              <span className="text-xs text-muted-foreground group-hover:text-primary">Add photo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
