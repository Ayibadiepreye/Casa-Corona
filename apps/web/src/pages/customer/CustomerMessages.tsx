import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Paperclip, Download, XCircle, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { conversationApi, Conversation, ConversationMessage } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  joinConversation,
  sendMessageSocket,
  markReadSocket,
} from "@/lib/socket";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

export default function CustomerMessages({ conversationId }: { conversationId?: string } = {}) {
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuth();
  const { toast } = useToast();
  const socket = useSocket(token ?? null);

  // Safe stringify for content (some old messages might store JSON or objects)
  const safeContent = (v: unknown): string => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") {
      const obj = v as any;
      return obj.content ?? obj.text ?? obj.message ?? JSON.stringify(v);
    }
    return String(v);
  };

  // ── Attachment state ───────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachments, setPendingAttachments] = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  // ── Export chat as .txt ───────────────────────────────────────────────
  const exportChat = (convo: Conversation, msgs: ConversationMessage[]) => {
    const lines = [
      `Casa Corona chat export`,
      `Conversation: ${convo.vendor?.businessName ?? "Vendor"}`,
      `Exported: ${new Date().toISOString()}`,
      ``,
      ...msgs.map(m => `[${new Date(m.createdAt).toLocaleString()}] ${m.senderRole === "customer" ? "You" : "Vendor"}: ${safeContent(m.content)}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${convo.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── End chat (delete conversation) ────────────────────────────────────
  const handleEndChat = async () => {
    if (!activeId) return;
    try {
      await conversationApi.end(activeId);
      setActiveId(null);
      setShowEndChatDialog(false);
      refetch();
      toast({ title: "Chat ended", description: "Messages will be permanently deleted in 24 hours." });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to end chat", variant: "destructive" });
    }
  };

  // ── Image upload (to backend) ─────────────────────────────────────────
  const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append("files", f));
      const { uploadApi } = await import("@/lib/api-client");
      const result = await uploadApi.images(fd);
      setPendingAttachments(prev => [...prev, ...result.urls.map((u: string, i: number) => ({ url: u, name: files[i]?.name ?? "image" }))]);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message ?? "Try again", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const { data: convoData, loading, refetch } = useApi(() =>
    conversationApi.list()
  );
  const conversations: Conversation[] = convoData?.conversations ?? [];

  // If we arrived here with a specific conversation id from the URL, sync it once
  useEffect(() => {
    if (conversationId && conversationId !== activeId) {
      setActiveId(conversationId);
    }
  }, [conversationId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: {
      conversationId: string;
      message: ConversationMessage;
    }) => {
      if (data.conversationId === activeId) {
        setMessages((prev) => [...prev, data.message]);
      }
      refetch(); // Refresh conversations list
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, activeId, refetch]);

  // When a conversation is selected, load messages, mark as read, and join room
  useEffect(() => {
    if (!activeId) return;
    setLoadingMessages(true);
    conversationApi
      .getMessages(activeId)
      .then((data) => {
        setMessages(data.messages ?? []);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
    conversationApi.markRead(activeId).catch(() => {});
    if (socket) {
      joinConversation(socket, activeId);
      markReadSocket(socket, activeId);
    }
  }, [activeId, socket]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-select first conversation
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations.length]);

  const send = async () => {
    if (!input.trim() || !activeId || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      if (socket) {
        // Optimistic update
        const tempMsg: ConversationMessage = {
          id: Date.now().toString(),
          conversationId: activeId,
          senderId: user?.id ?? "",
          senderRole: "customer",
          content,
          type: "text",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempMsg]);
        sendMessageSocket(socket, activeId, content);
      } else {
        const msg = await conversationApi.sendMessage(activeId, content);
        setMessages((prev) => [...prev, msg]);
      }
    } catch {
      /* silent — user sees message was not sent */
    } finally {
      setSending(false);
    }
  };

  const activeConvo = conversations.find((c) => c.id === activeId);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-full -m-6 lg:-m-8 flex">
      {/* Sidebar — full screen on mobile when no chat open, hidden when chat is open */}
      <div className={`${activeId ? "hidden md:flex" : "flex"} w-full md:w-72 shrink-0 border-r bg-card flex-col`}>
        <div className="p-4 border-b">
          <h2 className="font-serif font-bold text-lg">Messages</h2>
          {loading && <p className="text-xs text-muted-foreground mt-1">Loading…</p>}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              No conversations yet.
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "w-full text-left p-4 border-b hover:bg-muted/50 transition-colors",
                  activeId === c.id && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                      {c.vendor?.businessName?.[0] ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {c.vendor?.businessName ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.lastMessage ? safeContent((c.lastMessage as any).content ?? c.lastMessage) : "No messages"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(c.lastMessageAt)}
                    </span>
                    {c.customerUnread > 0 && (
                      <span className="w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                        {c.customerUnread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area — full screen on mobile when active, hidden when on list */}
      <div className={`${activeId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {activeConvo ? (
          <>
            <div className="p-4 border-b bg-card flex items-center gap-3">
              <button
                onClick={() => setActiveId(null)}
                className="md:hidden p-1 -ml-1 rounded-md hover:bg-muted"
                aria-label="Back to conversations"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {activeConvo.vendor?.businessName?.[0] ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">
                  {activeConvo.vendor?.businessName ?? "Vendor"}
                </p>
                <p className="text-xs text-muted-foreground">Vendor</p>
              </div>
              {/* Toolbar: export / end chat */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => exportChat(activeConvo, messages)}
                title="Export chat"
                aria-label="Export chat"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowEndChatDialog(true)}
                title="End chat"
                aria-label="End chat"
                className="text-red-500 hover:text-red-600"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No messages yet.
                </p>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderRole === "customer";
                  return (
                    <div
                      key={m.id}
                      className={cn("flex", isMe ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card border rounded-bl-sm"
                        )}
                      >
                        <p>{safeContent(m.content)}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1",
                            isMe
                              ? "text-primary-foreground/70 text-right"
                              : "text-muted-foreground"
                          )}
                        >
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 md:p-4 border-t bg-card">
              <div className="flex items-center gap-2 md:gap-3">
                {/* Attachment picker */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAttachment}
                  aria-label="Upload image attachments"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || uploading}
                  title="Attach images"
                  aria-label="Attach images"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && send()
                  }
                  placeholder="Type a message…"
                  className="flex-1 min-w-0"
                  disabled={sending}
                />
                <Button
                  className="rounded-full px-3 md:px-4 shrink-0"
                  onClick={send}
                  disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      <AlertDialog open={showEndChatDialog} onOpenChange={setShowEndChatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              The conversation will be archived and messages will be permanently deleted after 24 hours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
