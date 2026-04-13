"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { Home, PackageSearch, Wallet, ClipboardList, UserCircle2, Shield, Truck } from "lucide-react";
import type { UserRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const publicItems: { href: Route; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trips", label: "Trips", icon: PackageSearch },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/auth", label: "Auth", icon: UserCircle2 }
];

interface MobileNavProps {
  isAuthenticated: boolean;
  role: UserRole | null;
  isAdmin: boolean;
}

export function MobileNav({ isAuthenticated, role, isAdmin }: MobileNavProps): JSX.Element {
  const pathname = usePathname();
  const items = [...publicItems];

  if (isAuthenticated) {
    items[4] = { href: "/buyer/orders", label: "Buyer", icon: UserCircle2 };
    if (role === "traveler" || role === "both") {
      items[3] = { href: "/traveler/trips", label: "Traveler", icon: Truck };
    }
    if (isAdmin) {
      items[2] = { href: "/admin/users", label: "Admin", icon: Shield };
    }
  }

  return (
    <nav className="fixed inset-x-0 bottom-3 z-40 mx-auto w-[calc(100%-1.25rem)] max-w-md rounded-2xl border border-white/15 bg-black/40 p-1.5 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl py-2 text-[11px] transition",
                active ? "bg-electricBlue text-white" : "text-muted"
              )}
            >
              <Icon className="mb-0.5 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
