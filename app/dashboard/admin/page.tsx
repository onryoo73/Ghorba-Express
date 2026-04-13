"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Card } from "@/components/ui/card";

export default function AdminDashboardPage(): JSX.Element {
  return (
    <AppShell>
      <DashboardGuard adminOnly>
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <Card>Inspect users, resolve disputes, and manage operational risk.</Card>
          <Card>Dev view: admin access uses `NEXT_PUBLIC_ADMIN_EMAIL` match.</Card>
        </section>
      </DashboardGuard>
    </AppShell>
  );
}
