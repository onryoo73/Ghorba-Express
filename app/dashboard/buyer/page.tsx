"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Card } from "@/components/ui/card";

export default function BuyerDashboardPage(): JSX.Element {
  return (
    <AppShell>
      <DashboardGuard allowedRoles={["buyer", "both"]}>
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Buyer Dashboard</h1>
          <Card>Track your orders, wallet balance, and escrow timeline here.</Card>
          <Card>Dev view: connect this to your orders table and payment proofs next.</Card>
        </section>
      </DashboardGuard>
    </AppShell>
  );
}
