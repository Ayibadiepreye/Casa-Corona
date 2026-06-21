import { Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useApi } from "@/hooks/useApi";
import { conversationApi } from "@/lib/api-client";

export default function History() {
  const { data: conversationsData, loading } = useApi(() => conversationApi.list());
  const conversations = conversationsData?.conversations ?? [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-serif font-bold mb-1">Chat History</h1>
      <p className="text-muted-foreground mb-8">Your past conversations with businesses.</p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border rounded-2xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Clock size={28} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No chat history yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Past conversations will show up here.</p>
          <Button asChild className="rounded-full">
            <Link href="/browse">Browse vendors to start chatting</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((c: any) => (
            <Link key={c.id} href={`/messages/${c.id}`}>
              <div className="bg-card border rounded-2xl p-4 flex items-start gap-4 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold">{c.vendorName || c.vendor?.businessName || "Conversation"}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  {c.lastMessage ? (
                    <p className="text-sm text-muted-foreground truncate">
                      {typeof c.lastMessage === "string"
                        ? c.lastMessage
                        : c.lastMessage?.content
                          ? c.lastMessage.content
                          : c.lastMessagePreview || "—"}
                    </p>
                  ) : c.lastMessagePreview ? (
                    <p className="text-sm text-muted-foreground truncate">{c.lastMessagePreview}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No messages yet</p>
                  )}
                </div>
                <Button size="sm" variant="outline" className="rounded-full shrink-0">Open</Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
