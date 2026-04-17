"use client";

import { useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  userId: string;
  className?: string;
}

export function NotificationBell({ userId, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications(userId);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.offer_id) {
      router.push(`/messages?thread=${notification.offer_id}`);
    }
    
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-muted hover:bg-white/10 hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border border-white/15 bg-[#0f1726] shadow-xl z-50"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-3">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-electricBlue hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto max-h-80">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted text-sm">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5",
                        !notification.is_read && "bg-electricBlue/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.is_read && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-electricBlue" />
                        )}
                        <div className={cn("flex-1", !notification.is_read && "ml-0")}>
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted line-clamp-2">{notification.message}</p>
                          <p className="text-[10px] text-muted mt-1">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {notification.is_read && (
                          <Check className="h-4 w-4 text-emerald shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}