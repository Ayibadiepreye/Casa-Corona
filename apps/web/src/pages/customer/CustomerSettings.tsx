import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { userApi } from "@/lib/api-client";

type NotifPrefs = {
  emailMessages: boolean;
  emailReviewReplies: boolean;
  emailPlatformUpdates: boolean;
  emailMarketing: boolean;
  pushMessages: boolean;
  pushAnnouncements: boolean;
};

const defaultPrefs: NotifPrefs = {
  emailMessages: true,
  emailReviewReplies: true,
  emailPlatformUpdates: false,
  emailMarketing: false,
  pushMessages: true,
  pushAnnouncements: false,
};

function parsePrefs(raw: string | Record<string, boolean> | undefined): NotifPrefs {
  if (!raw) return defaultPrefs;
  const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
  return { ...defaultPrefs, ...obj };
}

export default function CustomerSettings() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Seed from user's stored prefs
  useEffect(() => {
    if (user?.notificationPreferences) {
      setPrefs(parsePrefs(user.notificationPreferences));
    }
  }, [user?.id]);

  const toggle = (key: keyof NotifPrefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const savePrefs = async () => {
    setSaving(true);
    try {
      await userApi.updateNotificationPrefs(prefs);
      toast({ title: "Preferences saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    toast({ title: "Data export requested", description: "You'll receive an email with your data within 30 days." });
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await userApi.deleteAccount();
      await signOut();
      setLocation("/");
      toast({ title: "Account deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to delete account", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your notification and privacy preferences.</p>
      </div>

      <div className="bg-card border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-5">Email Notifications</h2>
        <div className="space-y-5">
          {([
            { key: "emailMessages",       label: "New messages",       desc: "When a business replies to your message" },
            { key: "emailReviewReplies",  label: "Review replies",     desc: "When a business responds to your review" },
            { key: "emailPlatformUpdates",label: "Platform updates",   desc: "Product news and feature announcements" },
            { key: "emailMarketing",      label: "Promotions",         desc: "Featured deals and special offers" },
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
      </div>

      <div className="bg-card border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-5">Push Notifications</h2>
        <div className="space-y-5">
          {([
            { key: "pushMessages",      label: "New messages",         desc: "Instant notification for new messages" },
            { key: "pushAnnouncements", label: "Business announcements", desc: "Updates from businesses you follow" },
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

        <div className="mt-6 flex justify-end">
          <Button className="rounded-full px-8" onClick={savePrefs} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Preferences"}
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-5">Privacy & Data</h2>
        <div className="space-y-3">
          <Button variant="outline" className="rounded-full" onClick={handleExport}>
            Request Data Export
          </Button>
          <p className="text-xs text-muted-foreground">Receive a copy of all data we hold about you (NDPA 2023).</p>
        </div>
      </div>

      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
        <h2 className="font-semibold text-lg text-destructive mb-1">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back.</p>
        <Button variant="destructive" className="rounded-full" onClick={deleteAccount} disabled={deleting}>
          {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</> : "Delete Account"}
        </Button>
      </div>
    </div>
  );
}
