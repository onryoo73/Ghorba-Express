"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  Package,
  Shield,
  Truck,
  User,
  MessageSquare,
  Settings
} from "lucide-react";
import type { DashboardMode, UserRole } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isAuthenticated: boolean;
  role: UserRole | null;
  effectiveRole: DashboardMode | null;
  isAdmin: boolean;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

export function DashboardSidebar({
  isOpen,
  onToggle,
  isAuthenticated,
  role,
  effectiveRole,
  isAdmin,
  userId,
  userName,
  userAvatar
}: DashboardSidebarProps): JSX.Element {
  const pathname = usePathname();
  const { t } = useI18n();

  let links: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];

  if (isAuthenticated && isAdmin) {
    // Admins ONLY see administration links
    links = [
      { href: "/dashboard/admin", label: t('nav.adminDashboard'), icon: Shield },
      { href: "/dashboard", label: t('nav.hub'), icon: LayoutDashboard },
      { href: "/profile", label: t('nav.adminProfile'), icon: Settings }
    ];
  } else {
    // Regular users see everything else
    links = [
      { href: "/", label: t('nav.home'), icon: Home },
      { href: "/dashboard", label: t('nav.hub'), icon: LayoutDashboard }
    ];

    if (isAuthenticated && (effectiveRole === "buyer" || role === "buyer")) {
      links.push({ href: "/dashboard/buyer", label: t('nav.buyer'), icon: User });
    }
    if (isAuthenticated && (effectiveRole === "traveler" || role === "traveler")) {
      links.push({ href: "/dashboard/traveler", label: t('nav.traveler'), icon: Truck });
    }
    
    links.push({ href: "/orders", label: t('nav.orders'), icon: Package });
    if (isAuthenticated) {
      links.push({ href: "/messages", label: t('nav.messages'), icon: MessageSquare });
      links.push({ href: "/profile", label: t('nav.profile'), icon: Settings });
    }
  }

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-0 z-20 hidden border-r border-divider bg-surface-overlay/95 backdrop-blur-xl lg:block",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-full flex-col p-3">
        <div className={cn("mb-4 flex items-center", isOpen ? "justify-between" : "justify-center")}>
          {isOpen && (
            <p className="text-sm font-semibold text-foreground/90">Ghorba Express</p>
          )}
          <Button variant="ghost" className="h-9 w-9 p-0" onClick={onToggle}>
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Profile Link */}
        {isAuthenticated && userId && (
          <Link
            href={`/profile/${userId}`}
            className={cn(
              "mb-4 flex items-center rounded-xl p-2 transition hover:bg-surface-hover",
              isOpen ? "gap-3" : "justify-center"
            )}
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-electricBlue to-emerald flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden">
              {userAvatar ? (
                <img src={userAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                userName?.charAt(0) || "U"
              )}
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{userName || "User"}</p>
                <p className="text-[10px] text-muted truncate">
                  {isAdmin 
                    ? t('common.admin') 
                    : role === "both" 
                      ? `${t('auth.role.both')} · ${effectiveRole}` 
                      : t(`auth.role.${role}` as any) || t('common.member')}
                </p>
              </div>
            )}
          </Link>
        )}

        <nav className="space-y-1">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href as any}
                className={cn(
                  "flex items-center rounded-xl px-3 py-2 text-sm transition",
                  active ? "bg-electricBlue text-white" : "text-muted hover:bg-surface hover:text-foreground",
                  isOpen ? "gap-2" : "justify-center"
                )}
                title={link.label}
              >
                <Icon className="h-4 w-4" />
                {isOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
