"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat-panel";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authedJsonFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase/client";
import { useAuthSession } from "@/lib/use-auth-session";
import { 
  Truck, 
  DollarSign, 
  Package, 
  MapPin, 
  Calendar, 
  Weight,
  Plus,
  CheckCircle2,
  Clock,
  Star,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderRow {
  id: string;
  origin: string;
  destination: string;
  status: string;
  reward_tnd: number;
}

interface TripRow {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  weight_available_kg: number;
  status: string;
}

interface TravelerStats {
  totalEarnings: number;
  activeTrips: number;
  completedDeliveries: number;
  pendingOrders: number;
  rating: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    accepted: "bg-blue-500/20 text-blue-400",
    in_transit: "bg-purple-500/20 text-purple-400",
    delivered: "bg-emerald-500/20 text-emerald-400",
    completed: "bg-emerald-500/20 text-emerald-400",
    cancelled: "bg-rose-500/20 text-rose-400",
    open: "bg-emerald-500/20 text-emerald-400"
  };
  
  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", styles[status] || styles.pending)}>
      {status.replace("_", " ")}
    </span>
  );
};

export default function TravelerDashboardPage(): JSX.Element {
  const { profile, user } = useAuthSession();
  const [openOrders, setOpenOrders] = useState<OrderRow[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<OrderRow[]>([]);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [stats, setStats] = useState<TravelerStats | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [tripOrigin, setTripOrigin] = useState("");
  const [tripDestination, setTripDestination] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [tripWeight, setTripWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const [openResult, assignedResult] = await Promise.all([
        authedJsonFetch<{ orders: OrderRow[] }>("/api/orders?scope=open"),
        authedJsonFetch<{ orders: OrderRow[] }>("/api/orders?scope=assigned")
      ]);
      setOpenOrders(openResult.orders);
      setAssignedOrders(assignedResult.orders);
      
      // Calculate earnings from assigned orders
      const totalEarnings = assignedResult.orders
        .filter(o => o.status === "completed")
        .reduce((sum, o) => sum + (o.reward_tnd || 0), 0);
      
      setStats({
        totalEarnings,
        activeTrips: trips.filter(t => t.status === "open").length,
        completedDeliveries: assignedResult.orders.filter(o => o.status === "completed").length,
        pendingOrders: assignedResult.orders.filter(o => o.status === "pending").length,
        rating: profile?.rating || 5
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load traveler orders.");
    }
  };

  const loadTrips = async () => {
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: tripError } = await supabase
      .from("trips")
      .select("id, origin, destination, departure_date, weight_available_kg, status")
      .eq("traveler_id", user.id)
      .order("departure_date", { ascending: true });
    if (tripError) {
      setError(tripError.message);
      return;
    }
    setTrips((data as TripRow[] | null) ?? []);
  };

  useEffect(() => {
    void loadOrders();
    void loadTrips();
    setLoading(false);
  }, []);

  const createTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      return;
    }

    const { error: insertError } = await supabase.from("trips").insert({
      traveler_id: user.id,
      origin: tripOrigin,
      destination: tripDestination,
      departure_date: tripDate,
      weight_available_kg: Number(tripWeight),
      status: "open"
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTripOrigin("");
    setTripDestination("");
    setTripDate("");
    setTripWeight("");
    await loadTrips();
  };

  const closeTrip = async (tripId: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("trips")
      .update({ status: "cancelled" })
      .eq("id", tripId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadTrips();
  };

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

  const StatCard = ({ icon: Icon, label, value, trend, color }: { 
    icon: any, label: string, value: string | number, trend?: string, color: string 
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-4"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className="text-xs text-emerald flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </motion.div>
  );

  return (
    <AppShell>
      <DashboardGuard allowedRoles={["traveler", "both"]}>
        <div className="container max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Traveler Dashboard</h1>
              <p className="text-muted">Manage your trips and deliveries</p>
            </div>
            <Button 
              onClick={() => setShowTripForm(!showTripForm)}
              className="bg-emerald-500 hover:bg-emerald-600 gap-2"
            >
              {showTripForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Post Trip</>}
            </Button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={DollarSign}
                label="Total Earnings"
                value={`${stats.totalEarnings.toFixed(2)} TND`}
                color="bg-emerald-500/20 text-emerald-400"
              />
              <StatCard
                icon={Truck}
                label="Active Trips"
                value={stats.activeTrips}
                color="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={stats.completedDeliveries}
                trend={`${stats.rating.toFixed(1)} ★`}
                color="bg-purple-500/20 text-purple-400"
              />
              <StatCard
                icon={Clock}
                label="Pending Orders"
                value={stats.pendingOrders}
                color="bg-amber-500/20 text-amber-400"
              />
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose-400/20 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Create Trip Form */}
          {showTripForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-emerald-400" />
                  Post a New Trip
                </h2>
                <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void createTrip(event)}>
                  <div>
                    <label className="block text-sm text-muted mb-2">Origin City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <Input
                        placeholder="e.g. Tunis"
                        value={tripOrigin}
                        onChange={(event) => setTripOrigin(event.target.value)}
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
                        value={tripDestination}
                        onChange={(event) => setTripDestination(event.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">Departure Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <Input
                        type="date"
                        value={tripDate}
                        onChange={(event) => setTripDate(event.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">Available Weight (KG)</label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <Input
                        placeholder="e.g. 20"
                        type="number"
                        min="1"
                        value={tripWeight}
                        onChange={(event) => setTripWeight(event.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Publish Trip
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowTripForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* My Trips */}
            <div className="lg:col-span-1">
              <Card className="p-6 h-full">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-emerald-400" />
                  My Trips
                </h2>

                {trips.length > 0 ? (
                  <div className="space-y-4">
                    {trips.map((trip, i) => (
                      <motion.div
                        key={trip.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <StatusBadge status={trip.status} />
                          <span className="text-xs text-muted">{trip.departure_date}</span>
                        </div>
                        <p className="font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted" />
                          {trip.origin} → {trip.destination}
                        </p>
                        <p className="text-sm text-muted mt-1">{trip.weight_available_kg} KG available</p>
                        {trip.status === "open" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => void closeTrip(trip.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Close Trip
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-muted mx-auto mb-4" />
                    <p className="text-muted mb-4">No trips posted yet</p>
                    <Button onClick={() => setShowTripForm(true)} className="bg-emerald-500 gap-2">
                      <Plus className="h-4 w-4" />
                      Post Your First Trip
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Orders */}
            <div className="lg:col-span-2 space-y-6">
              {/* Open Orders */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5 text-electricBlue" />
                  Available Orders
                </h2>

                {openOrders.length > 0 ? (
                  <div className="space-y-4">
                    {openOrders.map((order, i) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted" />
                              {order.origin} → {order.destination}
                            </p>
                            <p className="text-xs text-muted mt-1">Order ID: {order.id.slice(0, 8)}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-emerald">{order.reward_tnd} TND</p>
                              <p className="text-xs text-muted">Reward</p>
                            </div>
                            <Button 
                              onClick={() => void acceptOrder(order.id)}
                              className="bg-electricBlue"
                            >
                              Accept
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted mx-auto mb-4" />
                    <p className="text-muted">No open orders available</p>
                  </div>
                )}
              </Card>

              {/* My Assigned Orders */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  My Assigned Orders
                </h2>

                {assignedOrders.length > 0 ? (
                  <div className="space-y-4">
                    {assignedOrders.map((order, i) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <StatusBadge status={order.status} />
                              <span className="text-xs text-muted">{order.id.slice(0, 8)}</span>
                            </div>
                            <p className="font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted" />
                              {order.origin} → {order.destination}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-emerald">{order.reward_tnd} TND</p>
                              <p className="text-xs text-muted">Earning</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setActiveChatOrderId(order.id)}
                                className="gap-2"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Chat
                              </Button>
                              {order.status === "accepted" && (
                                <Button 
                                  size="sm" 
                                  onClick={() => void markInTransit(order.id)}
                                  className="bg-emerald-500"
                                >
                                  Start Delivery
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {order.status === "in_transit" && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-sm text-electricBlue flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Ask buyer to confirm delivery once item is received
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-muted mx-auto mb-4" />
                    <p className="text-muted mb-2">No assigned orders yet</p>
                    <p className="text-sm text-muted">Accept orders from available orders above</p>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {activeChatOrderId && <ChatPanel orderId={activeChatOrderId} />}
        </div>
      </DashboardGuard>
    </AppShell>
  );
}
