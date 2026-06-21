import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Paperclip, Download, XCircle, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";
import {
  conversationApi,
  Conversation,
  ConversationMessage,
  uploadApi,
} from "@/lib/api-client";
import {
  joinConversation,
  sendMessageSocket,
  markReadSocket,
} from "@/lib/socket";

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function VendorMessages() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, token } = useAuth();
  const { toast } = useToast();
  const socket = useSocket(token ?? null);

  const { data: convoData, loading, refetch } = useApi(() =>
    conversationApi.list()
  );
  const conversations: Conversation[] = convoData?.conversations ?? [];

  const safeContent = (v: unknown): string => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") {
      const obj = v as any;
      return obj.content ?? obj.text ?? obj.message ?? JSON.stringify(v);
    }
    return String(v);
  };

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (data: { conversationId: string; message: ConversationMessage }) => {
      if (data.conversationId === activeId) {
        setMessages((prev) => [...prev, data.message]);
      }
      refetch();
    };
    socket.on("message:new", handleNewMessage);
    return () => { socket.off("message:new", handleNewMessage); };
  }, [socket, activeId, refetch]);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMessages(true);
    conversationApi
      .getMessages(activeId)
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
    conversationApi.markRead(activeId).catch(() => {});
    if (socket) {
      joinConversation(socket, activeId);
      markReadSocket(socket, activeId);
    }
  }, [activeId, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        const tempMsg: ConversationMessage = {
          id: Date.now().toString(),
          conversationId: activeId,
          senderId: user?.id ?? "",
          senderRole: "vendor",
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
      /* silent */
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB per image", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const { urls } = await uploadApi.images(fd);
      const url = urls[0];
      const caption = prompt("Add a caption (optional):", "") ?? "";
      const content = caption ? `${caption}\n${url}` : url;
      if (socket) {
        sendMessageSocket(socket, activeId, content);
      } else {
        const msg = await conversationApi.sendMessage(activeId, content);
        setMessages((prev) => [...prev, msg]);
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEndChat = async () => {
    if (!activeId) return;
    if (!confirm("End this chat? The conversation will close but messages remain until auto-cleanup.")) return;
    try {
      await conversationApi.end(activeId);
      toast({ title: "Chat ended" });
      refetch();
    } catch (err: any) {
      toast({ title: "Failed to end chat", description: err.message, variant: "destructive" });
    }
  };

  const handleExportChat = async () => {
    if (!activeId) return;
    try {
      const data = await conversationApi.exportChat(activeId);
      const blob = new Blob([data.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${activeId}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Chat exported" });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    }
  };

  const activeConvo = conversations.find((c) => c.id === activeId);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-full -m-6 lg:-m-8 flex">
      {/* Sidebar — full on mobile when no chat, hidden when chat open */}
      <div className={`${activeId ? "hidden md:flex" : "flex"} w-full md:w-72 shrink-0 border-r bg-card flex-col`}>
        <div className="p-4 border-b">
          <h2 className="font-serif font-bold text-lg">Messages</h2>
          {loading && <p className="text-xs text-muted-foreground mt-1">Loading…</p>}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground p-4 text-center">No conversations yet.</p>
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
                      {c.customer?.name?.[0] ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.customer?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {safeContent(c.lastMessage?.content) || "No messages"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
                    {c.vendorUnread > 0 && (
                      <span className="min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                        {c.vendorUnread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${activeId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {activeConvo ? (
          <>
            <div className="p-3 md:p-4 border-b bg-card flex items-center gap-3">
              <button
                onClick={() => setActiveId(null)}
                className="md:hidden -ml-1 p-1 hover:bg-muted rounded"
                aria-label="Back"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {activeConvo.customer?.name?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{activeConvo.customer?.name ?? "Customer"}</p>
                <p className="text-xs text-muted-foreground">
                  {activeConvo.endedAt ? "Chat ended" : "Customer"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleExportChat}
                  title="Export chat"
                  className="h-8 w-8"
                >
                  <Download className="w-4 h-4" />
                </Button>
                {!activeConvo.endedAt && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleEndChat}
                    title="End chat"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No messages yet.</p>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderRole === "vendor";
                  const attachmentUrl = m.attachmentUrl ?? (typeof m.content === "string" && m.content.startsWith("http") ? m.content : null);
                  return (
                    <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] md:max-w-sm px-4 py-2.5 rounded-2xl text-sm",
                        isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"
                      )}>
                        {attachmentUrl ? (
                          <img src={attachmentUrl} alt="attachment" className="rounded-lg max-w-full mb-1" />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{safeContent(m.content)}</p>
                        )}
                        <p className={cn("text-[10px] mt-1", isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {!activeConvo.endedAt && (
              <div className="p-3 md:p-4 border-t bg-card">
                <div className="flex items-center gap-2 md:gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Attach image"
                    className="h-10 w-10 shrink-0"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder="Type a message…"
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button
                    className="rounded-full px-3 md:px-4 shrink-0"
                    onClick={send}
                    disabled={sending || !input.trim()}
                    size="icon"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}