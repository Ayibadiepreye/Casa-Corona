import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { myVendorApi, UpdateVendorData, uploadApi } from "@/lib/api-client";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_HOURS: Record<string, string> = {
  Monday: "9:00 AM - 7:00 PM",
  Tuesday: "9:00 AM - 7:00 PM",
  Wednesday: "9:00 AM - 7:00 PM",
  Thursday: "9:00 AM - 7:00 PM",
  Friday: "9:00 AM - 7:00 PM",
  Saturday: "10:00 AM - 6:00 PM",
  Sunday: "Closed",
};

export default function VendorProfile() {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: vendor, loading } = useApi(() => myVendorApi.get());

  const [form, setForm] = useState<UpdateVendorData>({});
  const [hours, setHours] = useState<Record<string, string>>(DEFAULT_HOURS);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [coverUrl, setCoverUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Seed form when vendor loads
  useEffect(() => {
    if (vendor) {
      setForm({
        businessName: vendor.businessName ?? "",
        description: vendor.description ?? "",
        phone: vendor.phone ?? "",
        whatsapp: vendor.whatsapp ?? "",
        website: vendor.website ?? "",
        instagram: vendor.instagram ?? "",
        address: vendor.address ?? "",
        city: vendor.city ?? "",
        state: vendor.state ?? "",
      });
      setLogoUrl(vendor.logoUrl);
      setCoverUrl(vendor.coverUrl);
      if (vendor.hours && typeof vendor.hours === "object") {
        setHours({ ...DEFAULT_HOURS, ...(vendor.hours as Record<string, string>) });
      }
    }
  }, [vendor?.id]);

  const set = (key: keyof UpdateVendorData, value: string) =>
    setForm(p => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!vendor) return;
    setSaving(true);
    try {
      await myVendorApi.update(vendor.id, { ...form, hours });
      toast({ title: "Profile saved", description: "Your business profile has been updated." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vendor) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const { urls } = await uploadApi.images(fd);
      await myVendorApi.update(vendor.id, { logoUrl: urls[0] });
      setLogoUrl(urls[0]);
      toast({ title: "Logo updated" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !vendor) return;
      setUploadingCover(true);
      try {
        const fd = new FormData();
        fd.append('files', file);
        const { urls } = await uploadApi.images(fd);
        await myVendorApi.update(vendor.id, { coverUrl: urls[0] });
        setCoverUrl(urls[0]);
        toast({ title: "Cover image updated" });
      } catch (e: any) {
        toast({ title: "Upload failed", description: e.message, variant: "destructive" });
      } finally {
        setUploadingCover(false);
      }
    };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold mb-1">Business Profile</h1>
        <p className="text-muted-foreground">How your business appears publicly on Casa Corona.</p>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        {/* Cover */}
        <div
          className="relative h-36 bg-gradient-to-r from-primary/20 to-primary/5"
          style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        >
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          <button
            className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/70 transition disabled:opacity-50"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
          >
            {uploadingCover ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
            {uploadingCover ? "Uploading…" : "Change Cover"}
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-card overflow-hidden bg-primary shadow">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary-foreground font-serif font-bold text-2xl">
                    {(form.businessName ?? vendor?.businessName ?? "?")[0]}
                  </div>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <button
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow disabled:opacity-50"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? <Loader2 size={10} className="text-primary-foreground animate-spin" /> : <Camera size={11} className="text-primary-foreground" />}
              </button>
            </div>
            <div className="pb-1">
              <p className="font-semibold">{form.businessName || vendor?.businessName}</p>
              <p className="text-sm text-muted-foreground">{form.city || vendor?.city}, {form.state || vendor?.state}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={form.businessName ?? ""} onChange={e => set("businessName", e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="+234 800 000 0000" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <Input value={form.whatsapp ?? ""} onChange={e => set("whatsapp", e.target.value)} placeholder="+234 800 000 0000" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website ?? ""} onChange={e => set("website", e.target.value)} placeholder="https://yourwebsite.com" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={form.instagram ?? ""} onChange={e => set("instagram", e.target.value)} placeholder="https://instagram.com/yourhandle" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city ?? ""} onChange={e => set("city", e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={form.state ?? ""} onChange={e => set("state", e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Full Address</Label>
              <Input value={form.address ?? ""} onChange={e => set("address", e.target.value)} placeholder="Street address" className="h-11" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Business Description</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={e => set("description", e.target.value)}
                rows={4}
                className="resize-none"
                placeholder="Describe your business…"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Opening Hours */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-4">Opening Hours</h2>
        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-4">
              <span className="text-sm font-medium w-24 shrink-0">{day}</span>
              <Input
                value={hours[day] ?? ""}
                onChange={e => setHours(p => ({ ...p, [day]: e.target.value }))}
                className="h-9 text-sm"
                placeholder={day === "Sunday" ? "Closed" : "9:00 AM - 7:00 PM"}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="rounded-full px-8" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
