"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export function useUnreadMessageCount(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId || !supabase) return;

    const fetchUnread = async () => {
      if (!supabase) return;
      // Get all threads where user is a participant
      const { data: threads } = await supabase
        .from("chat_threads")
        .select("id")
        .or(`buyer_id.eq.${userId},traveler_id.eq.${userId}`);

      if (!threads?.length) {
        setUnreadCount(0);
        return;
      }

      const threadIds = threads.map(t => t.id);
      
      // Count unread messages in those threads
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .in("thread_id", threadIds)
        .neq("sender_id", userId)
        .eq("is_read", false);

      setUnreadCount(count || 0);
    };

    fetchUnread();

    // Subscribe to new messages
    const subscription = supabase
      .channel("unread_messages")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages"
      }, async (payload) => {
        if (!supabase) return;
        const msg = payload.new as any;
        
        // Check if this message is for current user
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("buyer_id, traveler_id")
          .eq("id", msg.thread_id)
          .single();

        if (thread && msg.sender_id !== userId) {
          if (thread.buyer_id === userId || thread.traveler_id === userId) {
            setUnreadCount(prev => prev + 1);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return unreadCount;
}
