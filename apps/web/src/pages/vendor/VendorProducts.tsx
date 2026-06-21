import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, X, Loader2, Package, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { myVendorApi, productsApi, uploadApi, VendorProduct, CreateProductData } from "@/lib/api-client";
import { formatNaira } from "@/lib/utils";
import { validateImages, IMAGE_INPUT_ACCEPT } from "@/lib/upload-validation";

type FormState = {
  name: string;
  description: string;
  price: string;
  buyLink: string;
  imageUrls: string[];
};

const emptyForm: FormState = {
  name: "", description: "", price: "", buyLink: "", imageUrls: []
};

export default function VendorProducts() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: vendor } = useApi(() => myVendorApi.get());
  const { data, loading, refetch } = useApi(
    () => vendor?.id ? productsApi.list(vendor.id) : Promise.resolve([] as any[]),
    [vendor?.id]
  );
  const products: VendorProduct[] = data ?? [];

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const setF = (key: keyof FormState, val: string | string[]) =>
    setForm(p => ({ ...p, [key]: val }));

  const toApiData = (): CreateProductData => ({
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    price: parseInt(form.price) || 0,
    buyLink: form.buyLink.trim() || undefined,
    images: form.imageUrls.length > 0 ? form.imageUrls : undefined,
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // reset so same file can be re-selected
    if (files.length === 0) return;

    // Enforce 5MB cap + image type
    const { ok, files: validFiles, errors } = await validateImages(files);
    if (errors.length > 0) {
      toast({ title: "Some files were skipped", description: errors.join("\n"), variant: "destructive" });
    }
    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const fd = new FormData();
      validFiles.forEach(f => fd.append('files', f));
      const { urls } = await uploadApi.images(fd);
      setForm(p => ({ ...p, imageUrls: [...p.imageUrls, ...urls] }));
      toast({ title: `${urls.length} image${urls.length > 1 ? "s" : ""} uploaded` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setForm(p => ({ ...p, imageUrls: p.imageUrls.filter((_, i) => i !== idx) }));
  };

  const handleAdd = async () => {
    if (!form.name || !form.price || !vendor) return;
    setSaving(true);
    try {
      await productsApi.create(vendor.id, toApiData());
      toast({ title: "Product added" });
      setForm(emptyForm);
      setAdding(false);
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      await productsApi.update(id, toApiData());
      toast({ title: "Product updated" });
      setEditingId(null);
      setForm(emptyForm);
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await productsApi.delete(id);
      toast({ title: "Product removed" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (p: VendorProduct) => {
    setEditingId(p.id);
    setAdding(false);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      buyLink: p.buyLink ?? "",
      imageUrls: p.images ?? [],
    });
  };

  const ProductForm = ({ onSave, onCancel, label }: { onSave: () => void; onCancel: () => void; label: string }) => (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{label}</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
      </div>

      {/* Image upload section */}
      <div className="mb-4">
        <Label>Product Images (up to 6, 5MB each)</Label>
        <div className="mt-2 flex flex-wrap gap-3">
          {form.imageUrls.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border bg-muted group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {form.imageUrls.length < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition disabled:opacity-50"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              <span className="text-[10px] mt-1">{uploading ? "…" : "Add"}</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_INPUT_ACCEPT}
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input placeholder="e.g. Lash Serum" value={form.name} onChange={e => setF("name", e.target.value)} className="h-10" />
        </div>
        <div className="space-y-2">
          <Label>Price (₦) *</Label>
          <Input type="number" placeholder="8500" value={form.price} onChange={e => setF("price", e.target.value)} className="h-10" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Buy Link (optional)</Label>
          <Input placeholder="https://…" value={form.buyLink} onChange={e => setF("buyLink", e.target.value)} className="h-10" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Description</Label>
          <Textarea placeholder="Brief description…" value={form.description} onChange={e => setF("description", e.target.value)} rows={2} className="resize-none" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" className="rounded-full" onClick={onCancel}>Cancel</Button>
        <Button className="rounded-full" onClick={onSave} disabled={saving || !form.name || !form.price}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Product"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold mb-1">Products</h1>
          <p className="text-muted-foreground">Retail products available at your business.</p>
        </div>
        <Button className="rounded-full gap-2" onClick={() => { setAdding(true); setEditingId(null); setForm(emptyForm); }}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {adding && (
        <ProductForm label="New Product" onSave={handleAdd} onCancel={() => { setAdding(false); setForm(emptyForm); }} />
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Package size={32} className="mx-auto mb-3 opacity-40" />
          <p>No products yet. Add your first product above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id}>
              {editingId === p.id ? (
                <ProductForm label="Edit Product" onSave={() => handleEdit(p.id)} onCancel={() => { setEditingId(null); setForm(emptyForm); }} />
              ) : (
                <div className="bg-card border rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-muted rounded-xl shrink-0 flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{p.name}</p>
                    {p.description && <p className="text-sm text-muted-foreground line-clamp-1">{p.description}</p>}
                    <p className="text-lg font-bold text-primary mt-1">{formatNaira(p.price)}</p>
                    {p.images && p.images.length > 1 && (
                      <p className="text-xs text-muted-foreground">+{p.images.length - 1} more image{p.images.length > 2 ? "s" : ""}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" onClick={() => startEdit(p)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-8 w-8 p-0 rounded-lg hover:text-destructive hover:bg-destructive/10"
                      disabled={deletingId === p.id}
                      onClick={() => remove(p.id)}
                    >
                      {deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
