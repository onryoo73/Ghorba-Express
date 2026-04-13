"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Card } from "@/components/ui/card";

export default function TravelerDashboardPage(): JSX.Element {
  return (
    <AppShell>
      <DashboardGuard allowedRoles={["traveler", "both"]}>
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Traveler Dashboard</h1>
          <Card>Manage trips, accepted jobs, delivery confirmations, and earnings.</Card>
          <Card>Dev view: traveler actions are visible here for quick testing.</Card>
        </section>
      </DashboardGuard>
    </AppShell>
  );
}
