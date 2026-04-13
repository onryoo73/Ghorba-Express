"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authedJsonFetch } from "@/lib/api-client";

interface OrderRow {
  id: string;
  status: string;
  origin: string;
  destination: string;
}

interface DisputeRow {
  id: string;
  order_id: string;
  reason: string;
  status: string;
}

export default function AdminDashboardPage(): JSX.Element {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      const [ordersResult, disputesResult] = await Promise.all([
        authedJsonFetch<{ orders: OrderRow[] }>("/api/admin/orders"),
        authedJsonFetch<{ disputes: DisputeRow[] }>("/api/admin/disputes")
      ]);
      setOrders(ordersResult.orders);
      setDisputes(disputesResult.disputes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const releaseEscrow = async () => {
    try {
      await authedJsonFetch("/api/escrow/release", {
        method: "POST",
        body: JSON.stringify({ orderId: selectedOrderId })
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Release failed.");
    }
  };

  const refundEscrow = async () => {
    try {
      await authedJsonFetch("/api/escrow/refund", {
        method: "POST",
        body: JSON.stringify({ orderId: selectedOrderId, reason: refundReason })
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed.");
    }
  };

  return (
    <AppShell>
      <DashboardGuard adminOnly>
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          {error && <p className="text-sm text-red-300">{error}</p>}

          <Card className="space-y-2">
            <h2 className="font-medium">Escrow Actions</h2>
            <Input
              placeholder="Order ID"
              value={selectedOrderId}
              onChange={(event) => setSelectedOrderId(event.target.value)}
            />
            <Input
              placeholder="Refund reason (optional)"
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => void releaseEscrow()}>Release Escrow</Button>
              <Button variant="secondary" onClick={() => void refundEscrow()}>
                Refund Escrow
              </Button>
            </div>
          </Card>

          <Card className="space-y-2">
            <h2 className="font-medium">Recent Orders</h2>
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-muted">ID: {order.id}</p>
                <p className="text-sm">
                  {order.origin} to {order.destination}
                </p>
                <p className="text-xs uppercase text-muted">Status: {order.status}</p>
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-muted">No orders found.</p>}
          </Card>

          <Card className="space-y-2">
            <h2 className="font-medium">Disputes</h2>
            {disputes.map((dispute) => (
              <div key={dispute.id} className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-muted">Dispute: {dispute.id}</p>
                <p className="text-sm">Order: {dispute.order_id}</p>
                <p className="text-sm">{dispute.reason}</p>
                <p className="text-xs uppercase text-muted">Status: {dispute.status}</p>
              </div>
            ))}
            {disputes.length === 0 && <p className="text-sm text-muted">No disputes.</p>}
          </Card>
        </section>
      </DashboardGuard>
    </AppShell>
  );
}
