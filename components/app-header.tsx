"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardMode, UserRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  isAuthenticated: boolean;
  role: UserRole | null;
  effectiveRole: DashboardMode | null;
  isAdmin: boolean;
  onModeChange: (mode: DashboardMode) => void;
  onSignOut: () => Promise<void>;
}

export function AppHeader({
  isAuthenticated,
  role,
  effectiveRole,
  isAdmin,
  onModeChange,
  onSignOut
}: AppHeaderProps): JSX.Element {
  const pathname = usePathname();
  const links: { href: Route; label: string }[] = [
    { href: "/", label: "Home" },
    { href: "/trips", label: "Trips" },
    { href: "/wallet", label: "Wallet" },
    { href: "/orders", label: "Orders" },
    { href: "/dashboard", label: "Dashboard" }
  ];

  return (
    <header className="sticky top-3 z-30 mb-6 rounded-2xl border border-white/15 bg-[#0f1726]/80 px-4 py-3 shadow-glow backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electricBlue/20">
            <PackageCheck className="h-5 w-5 text-electricBlue" />
          </div>
          <div>
            <p className="text-sm font-semibold">CousinExpress</p>
            <p className="text-xs text-muted">Crowdsourced shipping</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
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

        <div className="ml-auto flex items-center gap-2">
          <Badge
            className={
              isAuthenticated
                ? "border-emerald/40 bg-emerald/20 text-emerald"
                : "border-white/20 bg-white/10 text-muted"
            }
          >
            {isAuthenticated ? "Authenticated" : "Guest"}
          </Badge>
          {isAuthenticated && role && (
            <Badge className="border-white/20 bg-white/10 text-foreground">
              {isAdmin ? "admin" : role === "both" ? `both (${effectiveRole})` : role}
            </Badge>
          )}
          {isAuthenticated && role === "both" && (
            <div className="hidden rounded-xl border border-white/15 bg-black/20 p-1 sm:flex">
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
