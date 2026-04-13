"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/lib/use-auth-session";
import type { UserRole } from "@/lib/supabase/types";

interface RoleGuardProps {
  children: React.ReactNode;
  allowRoles?: UserRole[];
  adminOnly?: boolean;
}

export function RoleGuard({ children, allowRoles, adminOnly = false }: RoleGuardProps): JSX.Element {
  const router = useRouter();
  const { isReady, isAuthenticated, role, isAdmin, phoneVerified } = useAuthSession();

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }
    if (!phoneVerified) {
      router.replace("/auth");
      return;
    }
    if (adminOnly && !isAdmin) {
      router.replace("/");
      return;
    }
    if (allowRoles && role && !allowRoles.includes(role) && !isAdmin) {
      router.replace("/");
    }
  }, [isReady, isAuthenticated, role, isAdmin, phoneVerified, allowRoles, adminOnly, router]);

  if (!isReady) {
    return <p className="text-sm text-muted">Checking access...</p>;
  }

  if (!isAuthenticated || !phoneVerified) {
    return <p className="text-sm text-muted">Redirecting to secure auth...</p>;
  }

  if (adminOnly && !isAdmin) {
    return <p className="text-sm text-muted">Access denied.</p>;
  }

  if (allowRoles && role && !allowRoles.includes(role) && !isAdmin) {
    return <p className="text-sm text-muted">This dashboard is not enabled for your role.</p>;
  }

  return <>{children}</>;
}
