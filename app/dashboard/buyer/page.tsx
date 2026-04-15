"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChatPanel } from "@/components/chat-panel";
import { authedJsonFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase/client";
import { useAuthSession } from "@/lib/use-auth-session";
import { 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Plus,
  MapPin,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderRow {
  id: string;
  type: "buy_and_bring" | "pickup_and_bring";
  origin: string;
  destination: string;
  reward_tnd: number;
  status: string;
  delivery_qr_token: string | null;
  created_at: string;
}

interface BuyerStats {
  totalSpent: number;
  activeOrders: number;
  completedOrders: number;
  pendingOrders: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    accepted: "bg-blue-500/20 text-blue-400",
    in_transit: "bg-purple-500/20 text-purple-400",
    delivered: "bg-emerald-500/20 text-emerald-400",
    completed: "bg-emerald-500/20 text-emerald-400",
    cancelled: "bg-rose-500/20 text-rose-400"
  };
  
  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", styles[status] || styles.pending)}>
      {status.replace("_", " ")}
    </span>
  );
};

export default function BuyerDashboardPage(): JSX.Element {
  const { user } = useAuthSession();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [type, setType] = useState<"buy_and_bring" | "pickup_and_bring">("buy_and_bring");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [rewardTnd, setRewardTnd] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [productPriceTnd, setProductPriceTnd] = useState("");
  const [qrTokens, setQrTokens] = useState<Record<string, string>>({});
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await authedJsonFetch<{ orders: OrderRow[] }>("/api/orders?scope=mine");
      setOrders(result.orders);
      
      // Calculate stats
      const totalSpent = result.orders
        .filter(o => o.status === "completed")
        .reduce((sum, o) => sum + o.reward_tnd, 0);
      
      setStats({
        totalSpent,
        activeOrders: result.orders.filter(o => ["pending", "accepted", "in_transit"].includes(o.status)).length,
        completedOrders: result.orders.filter(o => o.status === "completed").length,
        pendingOrders: result.orders.filter(o => o.status === "pending").length
      });
      
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
          productPriceTnd: type === "buy_and_bring" && productPriceTnd ? Number(productPriceTnd) : null
        })
      });
      setOrigin("");
      setDestination("");
      setRewardTnd("");
      setItemDescription("");
      setProductPriceTnd("");
      setShowCreateForm(false);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order.");
    }
  };

  const confirmDelivery = async (orderId: string) => {
    try {
      await authedJsonFetch("/api/orders/confirm-delivery", {
        method: "POST",
        body: JSON.stringify({ orderId, qrToken: qrTokens[orderId] ?? "" })
      });
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm delivery.");
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-4"
    >
      <div className={`p-2 rounded-xl w-fit ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </motion.div>
  );

  return (
    <AppShell>
      <DashboardGuard allowedRoles={["buyer", "both"]}>
        <div className="container max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Buyer Dashboard</h1>
              <p className="text-muted">Manage your orders and deliveries</p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-electricBlue gap-2"
            >
              {showCreateForm ? "Cancel" : <><Plus className="h-4 w-4" /> Create Order</>}
            </Button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={DollarSign}
                label="Total Spent"
                value={`${stats.totalSpent.toFixed(2)} TND`}
                color="bg-amber-500/20 text-amber-400"
              />
              <StatCard
                icon={Package}
                label="Active Orders"
                value={stats.activeOrders}
                color="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={stats.completedOrders}
                color="bg-emerald-500/20 text-emerald-400"
              />
              <StatCard
                icon={Clock}
                label="Pending"
                value={stats.pendingOrders}
                color="bg-amber-500/20 text-amber-400"
              />
            </div>
          )}

          {/* Create Order Form */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-electricBlue" />
                  Create New Order
                </h2>
                <form onSubmit={(event) => void createOrder(event)} className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-muted mb-2">Order Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setType("buy_and_bring")}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          type === "buy_and_bring" 
                            ? "border-electricBlue bg-electricBlue/10" 
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <p className="font-medium">Buy & Bring</p>
                        <p className="text-xs text-muted mt-1">Traveler buys item and delivers</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("pickup_and_bring")}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          type === "pickup_and_bring" 
                            ? "border-electricBlue bg-electricBlue/10" 
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <p className="font-medium">Pickup & Bring</p>
                        <p className="text-xs text-muted mt-1">You already have the item</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-muted mb-2">Origin City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <Input 
                        placeholder="e.g. Tunis" 
                        value={origin} 
                        onChange={(e) => setOrigin(e.target.value)} 
                        required 
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-muted mb-2">Destination City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <Input 
                        placeholder="e.g. Sfax" 
                        value={destination} 
                        onChange={(e) => setDestination(e.target.value)} 
                        required 
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-muted mb-2">Reward (TND)</label>
                    <Input
                      placeholder="e.g. 50"
                      type="number"
                      min="1"
                      value={rewardTnd}
                      onChange={(e) => setRewardTnd(e.target.value)}
                      required
                    />
                  </div>

                  {type === "buy_and_bring" && (
                    <div>
                      <label className="block text-sm text-muted mb-2">Product Price (TND)</label>
                      <Input
                        placeholder="e.g. 200"
                        type="number"
                        min="0"
                        value={productPriceTnd}
                        onChange={(e) => setProductPriceTnd(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-sm text-muted mb-2">Item Description</label>
                    <Input
                      placeholder="Describe what you need delivered..."
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 flex gap-3">
                    <Button type="submit" className="flex-1 bg-electricBlue">
                      Create Order
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose-400/20 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Orders List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-electricBlue" />
              Your Orders
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-electricBlue/30 border-t-electricBlue rounded-full mx-auto" />
                <p className="text-muted mt-2">Loading orders...</p>
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <StatusBadge status={order.status} />
                          <span className="text-xs text-muted">{order.id.slice(0, 8)}</span>
                        </div>
                        <p className="font-medium text-lg flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted" />
                          {order.origin} → {order.destination}
                        </p>
                        <p className="text-sm text-muted mt-1">{order.type.replace("_", " ")}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-emerald">{order.reward_tnd} TND</p>
                          <p className="text-xs text-muted">Reward</p>
                        </div>

                        <div className="flex gap-2">
                          {["accepted", "in_transit", "delivered"].includes(order.status) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setActiveChatOrderId(order.id)}
                              className="gap-2"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Chat
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {order.status === "in_transit" && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-sm text-muted mb-2">Confirm delivery with QR token:</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Paste QR token from traveler"
                            value={qrTokens[order.id] ?? ""}
                            onChange={(e) => setQrTokens(prev => ({ ...prev, [order.id]: e.target.value }))}
                            className="flex-1"
                          />
                          <Button 
                            variant="secondary" 
                            onClick={() => void confirmDelivery(order.id)}
                            className="gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Confirm
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted mx-auto mb-4" />
                <p className="text-muted mb-4">No orders yet</p>
                <Button onClick={() => setShowCreateForm(true)} className="bg-electricBlue gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Order
                </Button>
              </div>
            )}
          </Card>

          {activeChatOrderId && <ChatPanel orderId={activeChatOrderId} />}
        </div>
      </DashboardGuard>
    </AppShell>
  );
}
