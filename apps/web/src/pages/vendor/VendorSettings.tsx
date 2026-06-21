import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { userApi } from "@/lib/api-client";

type NotifPrefs = {
  emailMessages: boolean;
  emailSubscription: boolean;
  emailReviews: boolean;
  pushMessages: boolean;
};

const defaultPrefs: NotifPrefs = {
  emailMessages: true,
  emailSubscription: true,
  emailReviews: true,
  pushMessages: true,
};

function parsePrefs(raw: string | Record<string, boolean> | undefined): NotifPrefs {
  if (!raw) return defaultPrefs;
  const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
  return { ...defaultPrefs, ...obj };
}

export default function VendorSettings() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setPrefs(parsePrefs(user.notificationPreferences));
    }
  }, [user?.id]);

  const toggle = (key: keyof NotifPrefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await userApi.updateProfile({ name, phone });
      toast({ title: "Account updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      await userApi.updateNotificationPrefs(prefs);
      toast({ title: "Preferences saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingPrefs(false);
    }
  };

  const deactivate = async () => {
    if (!confirm("Deactivate your listing? Your profile will be hidden from search.")) return;
    setDeactivating(true);
    try {
      await userApi.deleteAccount();
      await signOut();
      setLocation("/");
      toast({ title: "Account deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your vendor account preferences.</p>
      </div>

      {/* Account */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-5">Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input value={user?.email ?? ""} type="email" disabled className="h-11 opacity-60" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Phone Number</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" className="h-11" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button className="rounded-full px-8" onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-5">Notifications</h2>
        <div className="space-y-5">
          {([
            { key: "emailMessages",     label: "New messages",         desc: "Email when a customer contacts you" },
            { key: "emailSubscription", label: "Subscription alerts",   desc: "Expiry warnings and renewal receipts" },
            { key: "emailReviews",      label: "New reviews",           desc: "When a customer leaves a review" },
            { key: "pushMessages",      label: "Push — new messages",   desc: "Instant notification for messages" },
          ] as { key: keyof NotifPrefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <Label className="font-medium">{label}</Label>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={prefs[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <Button className="rounded-full px-8" onClick={savePrefs} disabled={savingPrefs}>
            {savingPrefs ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Preferences"}
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
        <h2 className="font-semibold text-lg text-destructive mb-1">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">These actions are permanent and cannot be undone.</p>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            className="rounded-full border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={deactivate}
            disabled={deactivating}
          >
            {deactivating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</> : "Delete Account"}
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            onClick={() => { signOut(); setLocation("/"); }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
