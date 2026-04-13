"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/lib/use-auth-session";

export default function DashboardPage(): JSX.Element {
  const { isAuthenticated, role, effectiveRole, isAdmin, profile, user } = useAuthSession();

  return (
    <AppShell>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard Hub</h1>
        {!isAuthenticated ? (
          <Card>
            <p className="mb-2 text-sm">You are not logged in.</p>
            <Link href="/auth">
              <Button>Go to Login</Button>
            </Link>
          </Card>
        ) : (
          <>
            <Card className="space-y-1">
              <p className="text-xs text-muted">Debug state (for development)</p>
              <p className="text-sm">Email: {user?.email ?? "no email"}</p>
              <p className="text-sm">Role: {role ?? "not loaded"}</p>
              <p className="text-sm">Active view: {effectiveRole ?? "none"}</p>
              <p className="text-sm">Profile: {profile ? "loaded" : "missing"}</p>
              <p className="text-sm">Admin: {isAdmin ? "yes" : "no"}</p>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              {(effectiveRole === "buyer" || role === "buyer") && (
                <Card className="space-y-2">
                  <h2 className="font-medium">Buyer</h2>
                  <p className="text-sm text-muted">Orders, wallet and escrow status.</p>
                  <Link href="/dashboard/buyer">
                    <Button className="w-full">Open Buyer Dashboard</Button>
                  </Link>
                </Card>
              )}
              {(effectiveRole === "traveler" || role === "traveler") && (
                <Card className="space-y-2">
                  <h2 className="font-medium">Traveler</h2>
                  <p className="text-sm text-muted">Trips, accepted jobs and earnings.</p>
                  <Link href="/dashboard/traveler">
                    <Button className="w-full">Open Traveler Dashboard</Button>
                  </Link>
                </Card>
              )}
              <Card className="space-y-2">
                <h2 className="font-medium">Admin</h2>
                <p className="text-sm text-muted">Users and dispute controls.</p>
                <Link href="/dashboard/admin">
                  <Button className="w-full" variant="secondary">
                    Open Admin Dashboard
                  </Button>
                </Link>
              </Card>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
