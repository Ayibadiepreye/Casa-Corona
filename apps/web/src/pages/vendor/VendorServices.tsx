import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, X, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { myVendorApi, servicesApi, VendorService, CreateServiceData } from "@/lib/api-client";
import { formatNaira } from "@/lib/utils";

type FormState = {
  name: string;
  description: string;
  priceMin: string;
  priceMax: string;
  durationMinutes: string;
  popular: boolean;
};

const emptyForm: FormState = { name: "", description: "", priceMin: "", priceMax: "", durationMinutes: "", popular: false };

function formatDuration(mins?: number): string {
  if (!mins) return "";
  if (mins >= 60) return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ""}`;
  return `${mins}m`;
}

export default function VendorServices() {
  const { toast } = useToast();

  const { data: vendor } = useApi(() => myVendorApi.get());
  const { data, loading, refetch } = useApi(
    () => vendor?.id ? servicesApi.list(vendor.id) : Promise.resolve([] as any[]),
    [vendor?.id]
  );
  const services: VendorService[] = data ?? [];

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const setF = (key: keyof FormState, val: string | boolean) =>
    setForm(p => ({ ...p, [key]: val }));

  const toApiData = (): CreateServiceData => ({
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    priceMin: parseInt(form.priceMin) || 0,
    priceMax: form.priceMax ? parseInt(form.priceMax) : undefined,
    durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
    popular: form.popular,
  });

  const handleAdd = async () => {
    if (!form.name || !form.priceMin || !vendor) return;
    setSaving(true);
    try {
      await servicesApi.create(vendor.id, toApiData());
      toast({ title: "Service added" });
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
    if (!form.name || !form.priceMin) return;
    setSaving(true);
    try {
      await servicesApi.update(id, toApiData());
      toast({ title: "Service updated" });
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
      await servicesApi.delete(id);
      toast({ title: "Service removed" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (s: VendorService) => {
    setEditingId(s.id);
    setAdding(false);
    setForm({
      name: s.name,
      description: s.description ?? "",
      priceMin: String(s.priceMin),
      priceMax: s.priceMax ? String(s.priceMax) : "",
      durationMinutes: s.durationMinutes ? String(s.durationMinutes) : "",
      popular: s.popular ?? false,
    });
  };

  const ServiceForm = ({ onSave, onCancel, label }: { onSave: () => void; onCancel: () => void; label: string }) => (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{label}</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label>Service Name *</Label>
          <Input placeholder="e.g. Hair Braiding" value={form.name} onChange={e => setF("name", e.target.value)} className="h-10" />
        </div>
        <div className="space-y-2">
          <Label>Min Price (₦) *</Label>
          <Input type="number" placeholder="5000" value={form.priceMin} onChange={e => setF("priceMin", e.target.value)} className="h-10" />
        </div>
        <div className="space-y-2">
          <Label>Max Price (₦)</Label>
          <Input type="number" placeholder="15000" value={form.priceMax} onChange={e => setF("priceMax", e.target.value)} className="h-10" />
        </div>
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input type="number" placeholder="60" value={form.durationMinutes} onChange={e => setF("durationMinutes", e.target.value)} className="h-10" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Description</Label>
          <Textarea placeholder="Brief description of this service…" value={form.description} onChange={e => setF("description", e.target.value)} rows={2} className="resize-none" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="popular" checked={form.popular} onChange={e => setF("popular", e.target.checked)} className="rounded" />
          <Label htmlFor="popular" className="cursor-pointer">Mark as popular</Label>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" className="rounded-full" onClick={onCancel}>Cancel</Button>
        <Button className="rounded-full" onClick={onSave} disabled={saving || !form.name || !form.priceMin}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Service"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold mb-1">Services</h1>
          <p className="text-muted-foreground">Manage the services you offer.</p>
        </div>
        <Button className="rounded-full gap-2" onClick={() => { setAdding(true); setEditingId(null); setForm(emptyForm); }}>
          <Plus size={16} /> Add Service
        </Button>
      </div>

      {adding && (
        <ServiceForm label="New Service" onSave={handleAdd} onCancel={() => { setAdding(false); setForm(emptyForm); }} />
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>No services yet. Add your first service above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id}>
              {editingId === s.id ? (
                <ServiceForm label="Edit Service" onSave={() => handleEdit(s.id)} onCancel={() => { setEditingId(null); setForm(emptyForm); }} />
              ) : (
                <div className="bg-card border rounded-2xl p-5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold">{s.name}</p>
                      {s.durationMinutes && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Clock size={10} /> {formatDuration(s.durationMinutes)}
                        </span>
                      )}
                      {s.popular && (
                        <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">Popular</span>
                      )}
                    </div>
                    {s.description && <p className="text-sm text-muted-foreground mb-2">{s.description}</p>}
                    <p className="text-lg font-bold text-primary">
                      {formatNaira(s.priceMin)}
                      {s.priceMax && s.priceMax !== s.priceMin && ` – ${formatNaira(s.priceMax)}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="rounded-lg h-8 w-8 p-0" onClick={() => startEdit(s)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="rounded-lg h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                      disabled={deletingId === s.id}
                      onClick={() => remove(s.id)}
                    >
                      {deletingId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
