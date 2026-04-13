"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/use-auth-session";
import type { UserRole } from "@/lib/supabase/types";

interface DashboardGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  adminOnly?: boolean;
}

export function DashboardGuard({
  children,
  allowedRoles,
  adminOnly = false
}: DashboardGuardProps): JSX.Element {
  const router = useRouter();
  const { isReady, isAuthenticated, role, effectiveRole, isAdmin } = useAuthSession();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }
    if (adminOnly && !isAdmin) {
      router.replace("/dashboard");
      return;
    }
    const currentRole = role === "both" ? effectiveRole : role;
    if (allowedRoles && currentRole && !allowedRoles.includes(currentRole) && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isReady, isAuthenticated, role, effectiveRole, isAdmin, adminOnly, allowedRoles, router]);

  if (!isReady) return <p className="text-sm text-muted">Checking session...</p>;
  if (!isAuthenticated) return <p className="text-sm text-muted">Redirecting to login...</p>;
  if (adminOnly && !isAdmin) return <p className="text-sm text-muted">Admin only.</p>;
  const currentRole = role === "both" ? effectiveRole : role;
  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole) && !isAdmin) {
    return <p className="text-sm text-muted">Role does not match this dashboard.</p>;
  }

  return <>{children}</>;
}
