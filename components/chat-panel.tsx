"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authedJsonFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase/client";
import { useAuthSession } from "@/lib/use-auth-session";

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface ChatPanelProps {
  orderId: string;
}

export function ChatPanel({ orderId }: ChatPanelProps): JSX.Element {
  const { user } = useAuthSession();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => draft.trim().length > 0 && Boolean(threadId), [draft, threadId]);

  const loadMessages = async (targetThreadId: string) => {
    const result = await authedJsonFetch<{ messages: ChatMessage[] }>(
      `/api/chat/messages?threadId=${targetThreadId}`
    );
    setMessages(result.messages);
  };

  const ensureThread = async () => {
    setLoading(true);
    try {
      const result = await authedJsonFetch<{ thread: { id: string } }>("/api/chat/threads", {
        method: "POST",
        body: JSON.stringify({ orderId })
      });
      setThreadId(result.thread.id);
      await loadMessages(result.thread.id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to initialize chat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void ensureThread();
  }, [orderId]);

  useEffect(() => {
    if (!threadId || !supabase) return;
    const realtime = supabase;
    const channel = supabase
      .channel(`chat-thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === incoming.id)) {
              return prev;
            }
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      void realtime.removeChannel(channel);
    };
  }, [threadId]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!threadId || !canSend) return;
    try {
      const payload = await authedJsonFetch<{ message: ChatMessage }>("/api/chat/messages", {
        method: "POST",
        body: JSON.stringify({ threadId, message: draft.trim() })
      });
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === payload.message.id)) {
          return prev;
        }
        return [...prev, payload.message];
      });
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    }
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-electricBlue" />
        <h3 className="font-medium">Order Chat</h3>
      </div>
      {loading && <p className="text-sm text-muted">Preparing chat...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="max-h-64 space-y-2 overflow-auto rounded-xl border border-white/10 p-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl p-2 text-sm ${
              msg.sender_id === user?.id ? "bg-electricBlue/20" : "bg-white/5"
            }`}
          >
            <p>{msg.message}</p>
            <p className="mt-1 text-[10px] text-muted">
              {new Date(msg.created_at).toLocaleTimeString()}
            </p>
          </div>
        ))}
        {messages.length === 0 && !loading && <p className="text-sm text-muted">No messages yet.</p>}
      </div>
      <form className="flex gap-2" onSubmit={(event) => void sendMessage(event)}>
        <Input
          placeholder="Type a message..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button disabled={!canSend}>Send</Button>
      </form>
    </Card>
  );
}
