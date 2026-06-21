import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  CreditCard,
  Shield,
  Bell,
  Loader2,
  Calendar,
  MessageSquare,
  FileText,
  MapPin,
  Clock,
  Crown,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { settingsApi, PlatformSettings } from "@/lib/api-client";

// ─────────────────────────────────────────────────────────────────────────────
// Plans Manager — edit subscription plan prices / discounts / descriptions
// ─────────────────────────────────────────────────────────────────────────────
interface AdminPlan {
  id: string;
  name: string;
  description: string | null;
  amountNgn: number;
  discountPct: number;
  monthsCovered: number;
  intervalLabel: string;
  active: boolean;
  sortOrder: number;
}

function PlansManager() {
  const { toast } = useToast();
  const { data: plansData, loading, refetch } = useApi<{ plans: AdminPlan[] }>(
    () => fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/payments/plans/all`, { credentials: "include", headers: { Authorization: `Bearer ${localStorage.getItem("cc_access_token") || ""}` } }).then(r => r.json()),
    []
  );
  const [draft, setDraft] = useState<Record<string, Partial<AdminPlan>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const plans: AdminPlan[] = plansData?.plans ?? [];

  const update = (id: string, field: keyof AdminPlan, value: any) => {
    setDraft(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const effective = (p: AdminPlan): AdminPlan => ({ ...p, ...draft[p.id] });

  const save = async (id: string) => {
    setSaving(id);
    try {
      const d = draft[id] ?? {};
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/payments/plans/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cc_access_token") || ""}`,
        },
        body: JSON.stringify(d),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: "Plan saved" });
      setDraft(prev => { const n = { ...prev }; delete n[id]; return n; });
      refetch();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Crown size={16} className="text-amber-500" /> Subscription Plans
          <span className="text-xs text-muted-foreground font-normal ml-2">— pricing shown on the vendor subscribe page</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(p => {
              const e = effective(p);
              const dirty = !!draft[p.id];
              return (
                <div key={p.id} className={`border rounded-2xl p-5 space-y-3 ${dirty ? "border-amber-400 bg-amber-50/30 dark:bg-amber-950/10" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{p.intervalLabel}</p>
                      <h3 className="font-semibold text-lg">{e.name}</h3>
                    </div>
                    <Badge variant={e.active ? "default" : "secondary"}>{e.active ? "Active" : "Inactive"}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Display name</Label>
                      <Input
                        className="h-9"
                        value={e.name}
                        onChange={ev => update(p.id, "name", ev.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price (₦)</Label>
                      <Input
                        type="number"
                        className="h-9"
                        value={e.amountNgn}
                        onChange={ev => update(p.id, "amountNgn", Number(ev.target.value))}
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Current: {formatNaira(e.amountNgn)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Months covered</Label>
                        <Input
                          type="number"
                          className="h-9"
                          value={e.monthsCovered}
                          onChange={ev => update(p.id, "monthsCovered", Number(ev.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="h-9"
                          value={e.discountPct}
                          onChange={ev => update(p.id, "discountPct", Number(ev.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        className="text-sm min-h-[60px]"
                        value={e.description ?? ""}
                        onChange={ev => update(p.id, "description", ev.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        checked={e.active}
                        onCheckedChange={v => update(p.id, "active", v)}
                      />
                      <span className="text-xs text-muted-foreground">{e.active ? "Shown on subscribe page" : "Hidden"}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full rounded-full"
                    onClick={() => save(p.id)}
                    disabled={!dirty || saving === p.id}
                  >
                    {saving === p.id ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3 mr-2" />
                    )}
                    Save changes
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSettings() {
  const { toast } = useToast();
  const { data: settings, loading, refetch } = useApi(() => settingsApi.getAllSettings());

  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const save = async (category: string) => {
    setSaving(category);
    try {
      await settingsApi.updateSettings(category, localSettings[category]);
      toast({ title: "Settings saved" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const updateField = (category: string, key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-serif font-bold">Platform Settings</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const categories = [
    {
      key: "pricing",
      title: "Pricing",
      icon: <CreditCard size={16} className="text-primary" />,
    },
    {
      key: "subscription",
      title: "Subscription",
      icon: <Calendar size={16} className="text-primary" />,
    },
    {
      key: "chat",
      title: "Chat",
      icon: <MessageSquare size={16} className="text-primary" />,
    },
    {
      key: "features",
      title: "Features",
      icon: <Shield size={16} className="text-primary" />,
    },
    {
      key: "limits",
      title: "Limits",
      icon: <Globe size={16} className="text-primary" />,
    },
    {
      key: "content",
      title: "Content",
      icon: <FileText size={16} className="text-primary" />,
    },
    {
      key: "geo",
      title: "Geolocation",
      icon: <MapPin size={16} className="text-primary" />,
    },
    {
      key: "cron",
      title: "Cron",
      icon: <Clock size={16} className="text-primary" />,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage global platform configuration</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <PlansManager />
        {categories.map(cat => (
          <Card key={cat.key} className="border">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {cat.icon} {cat.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(localSettings[cat.key] || {}).map(([key, val]) => {
                const isBoolean = typeof val === "boolean";
                const isNumber = typeof val === "number";
                const isArray = Array.isArray(val);

                return (
                  <div key={key} className="flex items-center gap-4">
                    <Label className="w-56 shrink-0 capitalize">{key.replace(/_/g, " ")}</Label>
                    {isBoolean ? (
                      <Switch
                        checked={val as boolean}
                        onCheckedChange={v => updateField(cat.key, key, v)}
                      />
                    ) : isArray ? (
                      <Input
                        type="text"
                        value={(val as any[]).join(", ")}
                        onChange={e =>
                          updateField(
                            cat.key,
                            key,
                            e.target.value.split(",").map(v => v.trim())
                          )
                        }
                        className="h-9 max-w-xs"
                      />
                    ) : isNumber ? (
                      <Input
                        type="number"
                        value={String(val)}
                        onChange={e => updateField(cat.key, key, Number(e.target.value))}
                        className="h-9 max-w-xs"
                      />
                    ) : (
                      <Input
                        type="text"
                        value={String(val)}
                        onChange={e => updateField(cat.key, key, e.target.value)}
                        className="h-9 max-w-xs"
                      />
                    )}
                  </div>
                );
              })}
              <Button
                size="sm"
                className="rounded-full"
                disabled={saving === cat.key}
                onClick={() => save(cat.key)}
              >
                {saving === cat.key ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />Saving…
                  </>
                ) : (
                  `Save ${cat.title}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
