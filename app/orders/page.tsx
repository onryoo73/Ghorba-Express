"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  MapPin, 
  Package, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Truck,
  ShieldCheck,
  DollarSign
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/lib/use-auth-session";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface OrderItem {
  id: string;
  post_id: string;
  buyer_id: string;
  traveler_id: string;
  proposed_price_tnd: number;
  total_paid_tnd: number;
  status: string;
  payment_status: string;
  delivery_status: string;
  created_at: string;
  post: {
    content: string;
    origin: string;
    destination: string;
  };
  buyer: { full_name: string };
  traveler: { full_name: string };
}

export const dynamic = "force-dynamic";

export default function OrdersPage(): JSX.Element {
  const { user, isAuthenticated } = useAuthSession();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user || !supabase) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from("post_offers")
        .select(`
          *,
          post:posts(content, origin, destination),
          buyer:profiles!buyer_id(full_name),
          traveler:profiles!traveler_id(full_name)
        `)
        .or(`buyer_id.eq.${user.id},traveler_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      
      // Real-time updates for orders
      const channel = supabase
        ?.channel('orders_updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'post_offers'
        }, () => fetchOrders())
        .subscribe();
        
      return () => {
        channel?.unsubscribe();
      };
    }
  }, [isAuthenticated, user?.id]);

  const getStatusColor = (status: string, paymentStatus: string, deliveryStatus: string) => {
    if (deliveryStatus === "completed") return "text-emerald bg-emerald/10 border-emerald/20";
    if (paymentStatus === "awaiting_verification") return "text-amber bg-amber/10 border-amber/20";
    if (paymentStatus === "authorized") return "text-electricBlue bg-electricBlue/10 border-electricBlue/20";
    if (status === "declined" || status === "cancelled") return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    return "text-muted bg-surface border-border";
  };

  const getStatusLabel = (status: string, paymentStatus: string, deliveryStatus: string) => {
    if (deliveryStatus === "completed") return "Completed";
    if (paymentStatus === "awaiting_verification") return "Verifying Payment";
    if (paymentStatus === "authorized") return "In Transit";
    if (paymentStatus === "awaiting_payment") return "Awaiting Payment";
    if (status === "accepted") return "Accepted";
    if (status === "pending") return "Offer Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-muted" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Login to see your orders</h1>
          <p className="text-muted text-sm max-w-xs mb-6">
            Track your deliveries, payments, and history in one place.
          </p>
          <Link href="/auth">
            <Button>Log in / Sign up</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-electricBlue/20">
              <ShoppingBag className="h-6 w-6 text-electricBlue" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">My Orders</h1>
              <p className="text-sm text-muted">Manage your active transactions and history</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-electricBlue mb-4" />
            <p className="text-sm text-muted">Loading your orders...</p>
          </div>
        ) : error ? (
          <Card className="p-8 border-rose-400/20 bg-rose-400/5 text-center">
            <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
            <p className="text-rose-300">{error}</p>
            <Button variant="secondary" onClick={fetchOrders} className="mt-4">Try Again</Button>
          </Card>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-medium mb-1">No orders yet</h3>
            <p className="text-sm text-muted mb-6">Browse requests or trips to start shipping.</p>
            <Link href="/">
              <Button variant="secondary">Go to Feed</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-5 hover:border-surface-hover transition-colors group">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                          getStatusColor(order.status, order.payment_status, order.delivery_status)
                        )}>
                          {getStatusLabel(order.status, order.payment_status, order.delivery_status)}
                        </span>
                        <span className="text-[10px] text-muted">#{order.id.slice(0, 8)}</span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-electricBlue transition-colors">
                          {order.post?.content || "Delivery Service"}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-electricBlue" />
                            {order.post?.origin} → {order.post?.destination}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted uppercase font-medium">Role</span>
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            {order.buyer_id === user?.id ? (
                              <><ShoppingBag className="h-3.5 w-3.5 text-rose-300" /> Buyer</>
                            ) : (
                              <><Truck className="h-3.5 w-3.5 text-emerald" /> Traveler</>
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted uppercase font-medium">Other Party</span>
                          <span className="text-sm font-medium">
                            {order.buyer_id === user?.id ? order.traveler?.full_name : order.buyer?.full_name}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted uppercase font-medium">Price</span>
                          <span className="text-sm font-bold text-electricBlue">
                            {order.proposed_price_tnd?.toFixed(2)} TND
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col justify-end gap-2 shrink-0">
                      <Link href="/messages" className="flex-1 sm:flex-none">
                        <Button variant="secondary" className="w-full gap-2 text-xs h-9">
                          Chat & Details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );        
}
