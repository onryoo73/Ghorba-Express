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
  MessageSquare
} from "lucide-react";
import type { DashboardMode, UserRole } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isAuthenticated: boolean;
  role: UserRole | null;
  effectiveRole: DashboardMode | null;
  isAdmin: boolean;
}

export function DashboardSidebar({
  isOpen,
  onToggle,
  isAuthenticated,
  role,
  effectiveRole,
  isAdmin
}: DashboardSidebarProps): JSX.Element {
  const pathname = usePathname();

  const links: { href: Route; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Hub", icon: LayoutDashboard }
  ];

  if (isAuthenticated && (effectiveRole === "buyer" || role === "buyer")) {
    links.push({ href: "/dashboard/buyer", label: "Buyer", icon: User });
  }
  if (isAuthenticated && (effectiveRole === "traveler" || role === "traveler")) {
    links.push({ href: "/dashboard/traveler", label: "Traveler", icon: Truck });
  }
  if (isAuthenticated && isAdmin) {
    links.push({ href: "/dashboard/admin", label: "Admin", icon: Shield });
  }
  links.push({ href: "/orders", label: "Orders", icon: Package });
  if (isAuthenticated) {
    links.push({ href: "/messages", label: "Messages", icon: MessageSquare });
  }

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-0 z-20 hidden border-r border-white/10 bg-[#0f1726]/90 backdrop-blur-xl lg:block",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-full flex-col p-3">
        <div className={cn("mb-4 flex items-center", isOpen ? "justify-between" : "justify-center")}>
          {isOpen && (
            <p className="text-sm font-semibold text-foreground/90">CousinExpress</p>
          )}
          <Button variant="ghost" className="h-9 w-9 p-0" onClick={onToggle}>
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center rounded-xl px-3 py-2 text-sm transition",
                  active ? "bg-electricBlue text-white" : "text-muted hover:bg-white/5 hover:text-foreground",
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
