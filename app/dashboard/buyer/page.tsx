"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authedJsonFetch } from "@/lib/api-client";

interface OrderRow {
  id: string;
  type: "buy_and_bring" | "pickup_and_bring";
  origin: string;
  destination: string;
  reward_tnd: number;
  status: string;
  delivery_qr_token: string | null;
}

export default function BuyerDashboardPage(): JSX.Element {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"buy_and_bring" | "pickup_and_bring">("buy_and_bring");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [rewardTnd, setRewardTnd] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [productPriceTnd, setProductPriceTnd] = useState("");
  const [qrTokens, setQrTokens] = useState<Record<string, string>>({});

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await authedJsonFetch<{ orders: OrderRow[] }>("/api/orders?scope=mine");
      setOrders(result.orders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const createOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await authedJsonFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          type,
          origin,
          destination,
          rewardTnd: Number(rewardTnd),
          itemDescription,
          productPriceTnd:
            type === "buy_and_bring" && productPriceTnd ? Number(productPriceTnd) : null
        })
      });
      setOrigin("");
      setDestination("");
      setRewardTnd("");
      setItemDescription("");
      setProductPriceTnd("");
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order.");
    }
  };

  const confirmDelivery = async (orderId: string) => {
    try {
      await authedJsonFetch("/api/orders/confirm-delivery", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          qrToken: qrTokens[orderId] ?? ""
        })
      });
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm delivery.");
    }
  };

  return (
    <AppShell>
      <DashboardGuard allowedRoles={["buyer", "both"]}>
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Buyer Dashboard</h1>
          <Card>
            <form onSubmit={(event) => void createOrder(event)} className="grid gap-2 sm:grid-cols-2">
              <select
                className="h-11 w-full rounded-2xl border border-white/15 bg-white/5 px-3 text-sm"
                value={type}
                onChange={(event) => setType(event.target.value as "buy_and_bring" | "pickup_and_bring")}
              >
                <option value="buy_and_bring">Buy & Bring</option>
                <option value="pickup_and_bring">Pickup & Bring</option>
              </select>
              <Input placeholder="Origin" value={origin} onChange={(event) => setOrigin(event.target.value)} required />
              <Input
                placeholder="Destination"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                required
              />
              <Input
                placeholder="Reward (TND)"
                type="number"
                min="1"
                value={rewardTnd}
                onChange={(event) => setRewardTnd(event.target.value)}
                required
              />
              {type === "buy_and_bring" && (
                <Input
                  placeholder="Product Price (TND)"
                  type="number"
                  min="0"
                  value={productPriceTnd}
                  onChange={(event) => setProductPriceTnd(event.target.value)}
                  required
                />
              )}
              <Input
                className="sm:col-span-2"
                placeholder="Item description"
                value={itemDescription}
                onChange={(event) => setItemDescription(event.target.value)}
                required
              />
              <Button className="sm:col-span-2">Create Order</Button>
            </form>
          </Card>

          {error && <p className="text-sm text-red-300">{error}</p>}
          {loading ? (
            <Card>Loading orders...</Card>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.id} className="space-y-2">
                  <p className="text-xs text-muted">Order ID: {order.id}</p>
                  <p className="font-medium">
                    {order.origin} to {order.destination} ({order.status})
                  </p>
                  <p className="text-sm text-emerald">Reward: {order.reward_tnd} TND</p>
                  {order.status === "in_transit" && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        placeholder="Paste QR token from traveler"
                        value={qrTokens[order.id] ?? ""}
                        onChange={(event) =>
                          setQrTokens((prev) => ({ ...prev, [order.id]: event.target.value }))
                        }
                      />
                      <Button variant="secondary" onClick={() => void confirmDelivery(order.id)}>
                        Confirm Delivery
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
              {orders.length === 0 && <Card>No orders yet.</Card>}
            </div>
          )}
        </section>
      </DashboardGuard>
    </AppShell>
  );
}
