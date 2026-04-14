"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Notification } from "@/lib/supabase/database.types";

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const fetchNotifications = useCallback(async () => {
    if (!supabase || !userIdRef.current) return;

    const { data } = await supabase
      .from("notifications")
      .select("*, sender:profiles(full_name)")
      .eq("recipient_id", userIdRef.current)
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifications(data || []);
    setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    setLoading(false);
  }, []);

  const markAsRead = async (notificationId: string) => {
    if (!supabase) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!supabase || !userId) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Subscribe to new notifications
  useEffect(() => {
    if (!supabase || !userId) return;

    const subscription = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
