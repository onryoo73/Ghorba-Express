"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, PackageSearch, Wallet, ClipboardList, MessageSquare, User, Shield } from "lucide-react";
import { useAuthSession } from "@/lib/use-auth-session";
import { useUnreadMessageCount } from "@/lib/hooks/use-unread-count";
import { cn } from "@/lib/utils";

const items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trips", label: "Trips", icon: PackageSearch },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/dashboard", label: "Dash", icon: LayoutDashboard }
];

const adminItems: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/dashboard/admin", label: "Admin", icon: Shield },
  { href: "/dashboard", label: "Hub", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User }
];

export function MobileNav({ isAuthenticated }: { isAuthenticated: boolean }): JSX.Element {
  const pathname = usePathname();
  const { user, isAdmin } = useAuthSession();
  const unreadCount = useUnreadMessageCount(user?.id);
  
  let filteredItems = [];
  
  if (isAuthenticated && isAdmin) {
    filteredItems = adminItems;
  } else {
    filteredItems = isAuthenticated ? items : items.filter(i => i.href !== "/messages" && i.href !== "/profile" && i.href !== "/dashboard");
    if (!isAuthenticated) {
      filteredItems.push({ href: "/auth", label: "Auth", icon: LayoutDashboard });
    }
  }

  return (
    <nav className="fixed inset-x-0 bottom-3 z-40 mx-auto w-[calc(100%-1.25rem)] max-w-md rounded-2xl border border-border bg-surface-overlay/95 p-1.5 backdrop-blur-xl shadow-glow-light dark:shadow-glow lg:hidden">
      <div className={cn("grid gap-1", filteredItems.length === 3 ? "grid-cols-3" : "grid-cols-5")}>
        {filteredItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl py-2 text-[11px] transition relative",
                active ? "bg-electricBlue text-white" : "text-muted hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="mb-0.5 h-4 w-4" />
                {item.href === "/messages" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-400 rounded-full text-[9px] flex items-center justify-center text-white font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
