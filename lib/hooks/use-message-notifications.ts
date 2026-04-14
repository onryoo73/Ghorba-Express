"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export function useMessageNotifications(
  userId: string | undefined,
  onNewMessage: (threadId: string, senderName: string, message: string) => void
) {
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!supabase || !userId) return;

    // Subscribe to all chat messages where user is a participant
    const subscription = supabase
      .channel("global_chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages"
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Check if this message is for the current user (they're in the thread)
          const { data: thread } = await supabase
            .from("chat_threads")
            .select("buyer_id, traveler_id")
            .eq("id", message.thread_id)
            .single();

          if (!thread) return;
          
          const isParticipant = thread.buyer_id === userIdRef.current || thread.traveler_id === userIdRef.current;
          const isFromMe = message.sender_id === userIdRef.current;
          
          if (isParticipant && !isFromMe) {
            // Get sender name
            const { data: sender } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", message.sender_id)
              .single();
            
            onNewMessage(message.thread_id, sender?.full_name || "Someone", message.message);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, onNewMessage]);
}
