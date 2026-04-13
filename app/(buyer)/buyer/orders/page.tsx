"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BuyerOrder {
  id: string;
  type: "buy_and_bring" | "pickup_and_bring";
  origin: string;
  destination: string;
  reward_tnd: number;
  status: string;
  created_at: string;
}

export default function BuyerOrdersPage(): JSX.Element {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!supabase) return;
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("orders")
        .select("id,type,origin,destination,reward_tnd,status,created_at")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      setOrders((data as BuyerOrder[] | null) ?? []);
      setLoading(false);
    };
    void loadOrders();
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Buyer Dashboard - Orders</h1>
      <p className="text-sm text-muted">Track your submitted requests and delivery progress.</p>
      {loading ? (
        <Card>Loading orders...</Card>
      ) : orders.length === 0 ? (
        <Card>No orders yet. Create one from the Orders page.</Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{order.origin} to {order.destination}</p>
                <Badge>{order.status}</Badge>
              </div>
              <p className="text-sm text-muted">{order.type === "buy_and_bring" ? "Buy & Bring" : "Pickup & Bring"}</p>
              <p className="text-sm text-emerald">Reward: {order.reward_tnd} TND</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
