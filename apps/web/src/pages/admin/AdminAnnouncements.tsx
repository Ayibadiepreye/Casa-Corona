import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Send, Loader2, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const API_BASE = () =>
  ((import.meta as any).env?.VITE_API_URL as string) || "http://localhost:5000/api/v1";

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<"all" | "customers" | "vendors" | "admins" | "specific">("all");
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; emailed: number; audience: string } | null>(null);
  const [userIds, setUserIds] = useState("");
  const [userList, setUserList] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (audience === "specific") {
      setLoadingUsers(true);
      fetch(`${API_BASE()}/admin/users?limit=200`, { credentials: "include" })
        .then(r => r.json())
        .then(j => setUserList(j?.data?.users ?? []))
        .catch(() => setUserList([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [audience]);

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Missing fields", description: "Title and body are required.", variant: "destructive" });
      return;
    }
    if (audience === "specific" && selectedUsers.size === 0) {
      toast({ title: "No users selected", description: "Pick at least one user to notify.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const payload: any = { title, body, audience, sendEmail };
      if (link.trim()) payload.link = link.trim();
      if (audience === "specific") payload.userIds = Array.from(selectedUsers);

      const res = await fetch(`${API_BASE()}/announcements/broadcast`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cc_access_token") || ""}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || `Server returned ${res.status}`);
      }
      const data = json.data;
      setLastResult({ sent: data.sent, emailed: data.emailed, audience: data.audience });
      toast({
        title: "Announcement sent",
        description: `Delivered to ${data.sent} user(s)${data.emailed > 0 ? `, emailed ${data.emailed}` : ""}.`,
      });
      setTitle("");
      setBody("");
      setLink("");
      setSelectedUsers(new Set());
    } catch (e: any) {
      toast({ title: "Failed to send", description: e?.message || "Unknown error", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" /> Send Announcement
          </CardTitle>
          <CardDescription>
            Send in-app notifications (and optionally emails) to users. Use this for platform-wide news,
            policy updates, or to reach out to a specific person.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. New feature alert"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write the announcement body..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={5}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">{body.length}/2000</p>
          </div>
          <div>
            <Label htmlFor="link">Optional link (call-to-action URL)</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://casacorona.org/promo"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Audience</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {(["all", "customers", "vendors", "admins", "specific"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    audience === a
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  {a === "specific" ? "Specific users" : a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {audience === "specific" && (
            <div className="border rounded-xl p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Select recipients ({selectedUsers.size} selected)
                </Label>
                {selectedUsers.size > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setSelectedUsers(new Set())}>
                    Clear
                  </Button>
                )}
              </div>
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Loading users…</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {userList.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{u.role}</Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="accent-primary"
            />
            <span className="text-sm flex items-center gap-1.5">
              <Mail className="w-4 h-4" /> Also send via email (capped at 100 recipients)
            </span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="rounded-full px-6"
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {sending ? "Sending…" : "Send announcement"}
            </Button>
            {lastResult && (
              <p className="text-sm text-muted-foreground">
                Last: <strong>{lastResult.sent}</strong> delivered to <code>{lastResult.audience}</code>
                {lastResult.emailed > 0 ? `, ${lastResult.emailed} emailed` : ""}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}