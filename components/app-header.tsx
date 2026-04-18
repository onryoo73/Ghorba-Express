"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { PackageCheck, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { DashboardMode, UserRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  offer_id?: string;
  post_id?: string;
  thread_id?: string;
}

interface AppHeaderProps {
  isAuthenticated: boolean;
  role: UserRole | null;
  effectiveRole: DashboardMode | null;
  isAdmin: boolean;
  userId?: string;
  onModeChange: (mode: DashboardMode) => void;
  onSignOut: () => Promise<void>;
}

export function AppHeader({
  isAuthenticated,
  role,
  effectiveRole,
  isAdmin,
  userId,
  onModeChange,
  onSignOut
}: AppHeaderProps): JSX.Element {
  const pathname = usePathname();
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (!isAuthenticated || !userId || isAdmin || !supabase) return;
    
    const fetchNotifs = async () => {
      const { data } = await supabase!
        .from("notifications")
        .select("id, title, message, type, is_read, created_at, offer_id, post_id, thread_id")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(data || []);
    };
    
    fetchNotifs();
    
    // Real-time subscription
    const channel = supabase!
      .channel("notif-header")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${userId}`
      }, () => {
        fetchNotifs();
      })
      .subscribe();
    
    return () => { supabase!.removeChannel(channel); };
  }, [isAuthenticated, userId, isAdmin]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0 || !supabase) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  let links: { href: string; label: string }[] = [];

  if (isAuthenticated && isAdmin) {
    links = [
      { href: "/dashboard/admin", label: t('nav.admin') },
      { href: "/dashboard", label: t('nav.dashboard') },
      { href: "/profile", label: t('nav.profile') }
    ];
  } else {
    links = [
      { href: "/", label: t('nav.home') },
      { href: "/trips", label: t('nav.trips') },
      { href: "/wallet", label: t('nav.wallet') },
      { href: "/orders", label: t('nav.orders') },
      { href: "/dashboard", label: t('nav.dashboard') }
    ];
  }

  return (
    <header className="sticky top-3 z-30 mb-6 rounded-2xl border border-border bg-surface-overlay/80 px-4 py-3 shadow-glow-light dark:shadow-glow backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electricBlue/20">
            <PackageCheck className="h-5 w-5 text-electricBlue" />
          </div>
          <div>
            <p className="text-sm font-semibold">Ghorba Express</p>
            <p className="text-xs text-muted">{isAdmin ? t('dashboard.adminView') : t('home.hero.subtitle')}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-xl border border-border bg-surface p-1 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href as any}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs transition",
                  active ? "bg-electricBlue text-white" : "text-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* Notification Bell */}
          {isAuthenticated && !isAdmin && (
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
                className="relative p-2 rounded-xl border border-border hover:bg-surface transition-all"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-surface-overlay backdrop-blur-xl shadow-2xl z-50">
                  <div className="p-3 border-b border-divider flex justify-between items-center">
                    <p className="text-sm font-medium">{t('common.notifications')}</p>
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500/20 text-red-500 dark:text-red-400 text-[10px]">{unreadCount} {t('profile.pending')}</Badge>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted text-center py-8">{t('common.noNotifications')}</p>
                  ) : (
                    <div className="divide-y divide-divider">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-sm ${!n.is_read ? "bg-electricBlue/5 dark:bg-electricBlue/10" : ""}`}
                        >
                          <p className="font-medium text-xs">{n.title}</p>
                          {n.message && <p className="text-muted text-xs mt-0.5">{n.message}</p>}
                          <p className="text-[10px] text-muted mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <Badge
            className={
              isAuthenticated
                ? "border-emerald/40 bg-emerald/20 text-emerald dark:text-emerald"
                : "border-border bg-surface text-muted"
            }
          >
            {isAuthenticated ? "Authenticated" : "Guest"}
          </Badge>
          {isAuthenticated && role && (
            <Badge className="border-border bg-surface text-foreground">
              {isAdmin ? "admin" : role === "both" ? `both (${effectiveRole})` : role}
            </Badge>
          )}
          {isAuthenticated && role === "both" && (
            <div className="hidden rounded-xl border border-border bg-surface p-1 sm:flex">
              <button
                type="button"
                onClick={() => onModeChange("buyer")}
                className={cn(
                  "rounded-lg px-2 py-1 text-xs",
                  effectiveRole === "buyer" ? "bg-electricBlue text-white" : "text-muted"
                )}
              >
                Buyer View
              </button>
              <button
                type="button"
                onClick={() => onModeChange("traveler")}
                className={cn(
                  "rounded-lg px-2 py-1 text-xs",
                  effectiveRole === "traveler" ? "bg-electricBlue text-white" : "text-muted"
                )}
              >
                Traveler View
              </button>
            </div>
          )}
          {isAuthenticated ? (
            <Button variant="secondary" onClick={() => void onSignOut()}>
              Log out
            </Button>
          ) : (
            <Link href="/auth">
              <Button>Log in / Sign up</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
