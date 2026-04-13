"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authedJsonFetch } from "@/lib/api-client";

interface OrderRow {
  id: string;
  origin: string;
  destination: string;
  status: string;
}

export default function TravelerDashboardPage(): JSX.Element {
  const [openOrders, setOpenOrders] = useState<OrderRow[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const [openResult, assignedResult] = await Promise.all([
        authedJsonFetch<{ orders: OrderRow[] }>("/api/orders?scope=open"),
        authedJsonFetch<{ orders: OrderRow[] }>("/api/orders?scope=assigned")
      ]);
      setOpenOrders(openResult.orders);
      setAssignedOrders(assignedResult.orders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load traveler orders.");
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const acceptOrder = async (orderId: string) => {
    try {
      await authedJsonFetch("/api/orders/accept", {
        method: "POST",
        body: JSON.stringify({ orderId })
      });
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept order.");
    }
  };

  const markInTransit = async (orderId: string) => {
    try {
      await authedJsonFetch("/api/orders/mark-in-transit", {
        method: "POST",
        body: JSON.stringify({ orderId })
      });
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark in transit.");
    }
  };

  return (
    <AppShell>
      <DashboardGuard allowedRoles={["traveler", "both"]}>
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Traveler Dashboard</h1>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Card className="space-y-2">
            <h2 className="font-medium">Open Orders</h2>
            {openOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-muted">Order ID: {order.id}</p>
                <p className="text-sm">
                  {order.origin} to {order.destination}
                </p>
                <Button className="mt-2" onClick={() => void acceptOrder(order.id)}>
                  Accept Order
                </Button>
              </div>
            ))}
            {openOrders.length === 0 && <p className="text-sm text-muted">No open orders available.</p>}
          </Card>

          <Card className="space-y-2">
            <h2 className="font-medium">My Assigned Orders</h2>
            {assignedOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-muted">Order ID: {order.id}</p>
                <p className="text-sm">
                  {order.origin} to {order.destination} ({order.status})
                </p>
                {order.status === "accepted" && (
                  <Button variant="secondary" className="mt-2" onClick={() => void markInTransit(order.id)}>
                    Mark In Transit
                  </Button>
                )}
                <p className="mt-2 text-xs text-electricBlue">
                  Ask buyer to confirm delivery with QR token once received.
                </p>
              </div>
            ))}
            {assignedOrders.length === 0 && <p className="text-sm text-muted">No accepted orders yet.</p>}
          </Card>
        </section>
      </DashboardGuard>
    </AppShell>
  );
}
