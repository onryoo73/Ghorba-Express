"use client";

import { Wallet, CheckCircle2, Smartphone, CreditCard, User, ArrowRight, ExternalLink, X, ChevronRight, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface PaymentProof {
  id: string;
  offer_id: string;
  order_id?: string;
  buyer_id: string;
  provider: string;
  image_url: string;
  amount_tnd: number;
  transaction_id: string;
  verified: boolean;
  created_at: string;
  buyer?: { full_name: string };
  // Offer status from joined post_offers
  offer_payment_released?: boolean;
  offer_payment_status?: string | null;
  offer_delivery_status?: string | null;
  offer_otp_verified?: boolean;
  offer_traveler_payment_method?: string | null;
  offer_traveler_payment_number?: string | null;
  offer_traveler_payment_name?: string | null;
  offer_traveler_id?: string | null;
}

interface PendingPayment {
  id: string;
  offerer_id: string;
  traveler_id: string;
  buyer_id?: string;
  amount_tnd: number;
  payment_status: string;
  delivery_status: string;
  traveler_payment_method?: string;
  traveler_payment_number?: string;
  traveler_payment_name?: string;
  payment_released?: boolean;
  otp_verified?: boolean;
  created_at?: string;
  traveler?: { full_name: string };
  buyer?: { full_name: string };
}

// Unified order card - merges buyer proof + traveler payment
interface OrderCard {
  id: string; // offer id
  buyerProof?: PaymentProof;
  travelerPayment?: PendingPayment;
  status: "buyer_pending" | "buyer_approved" | "traveler_pending" | "ready_release" | "released";
}

interface AdminStats {
  totalFees: number;
  totalTravelerEarnings: number;
  totalVolume: number;
  recentFees: Array<{
    id: string;
    amount: number;
    created_at: string;
    offer?: {
      buyer?: { full_name: string };
      traveler?: { full_name: string };
    };
  }>;
}

export default function AdminDashboardPage(): JSX.Element {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderCard | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Fetch orders
      try {
        const ordersResult = await authedJsonFetch<{ orders: OrderRow[] }>("/api/admin/orders");
        setOrders(ordersResult.orders || []);
      } catch (e) {
        console.error("Failed to load orders:", e);
        setOrders([]);
      }
      
      // Fetch disputes
      try {
        const disputesResult = await authedJsonFetch<{ disputes: DisputeRow[] }>("/api/admin/disputes");
        setDisputes(disputesResult.disputes || []);
      } catch (e) {
        console.error("Failed to load disputes:", e);
        setDisputes([]);
      }
      
      // Fetch payment proofs and pending traveler payments
      const proofsResult = await authedJsonFetch<{ data: PaymentProof[]; pendingPayments: PendingPayment[] }>("/api/admin/payment-proofs");
      setPaymentProofs(proofsResult.data || []);
      setPendingPayments(proofsResult.pendingPayments || []);

      // Fetch admin stats (platform revenue)
      try {
        const statsResult = await authedJsonFetch<AdminStats>("/api/admin/stats");
        setAdminStats(statsResult);
      } catch (e) {
        console.error("Failed to load admin stats:", e);
      }

      setError(null);
    } catch (err) {
      console.error("Admin data load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load admin data - check console for details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("[Admin] Loading data...");
    void loadAdminData();
  }, []);

  // Build order cards from proofs (which now include offer status)
  const buildOrderCards = (): OrderCard[] => {
    const cards: OrderCard[] = [];

    for (const proof of paymentProofs) {
      const key = proof.offer_id || proof.order_id || proof.id;
      
      // Synthetic proofs (Konnect payments) are auto-verified
      const isSynthetic = proof.id?.startsWith("synthetic_");
      const isVerified = proof.verified || isSynthetic;

      // Build a synthetic travelerPayment from the offer data embedded in the proof
      const offerTravelerPayment: PendingPayment | undefined =
        proof.offer_traveler_id ? {
          id: proof.offer_id,
          offerer_id: "",
          traveler_id: proof.offer_traveler_id,
          amount_tnd: proof.amount_tnd,
          payment_status: proof.offer_payment_status || "",
          delivery_status: proof.offer_delivery_status || "",
          traveler_payment_method: proof.offer_traveler_payment_method || undefined,
          traveler_payment_number: proof.offer_traveler_payment_number || undefined,
          traveler_payment_name: proof.offer_traveler_payment_name || undefined,
          payment_released: proof.offer_payment_released || false,
          otp_verified: proof.offer_otp_verified || false,
        } : undefined;

      // Determine status
      let status: OrderCard["status"];
      if (proof.offer_payment_released) {
        status = "released";
      } else if (proof.offer_traveler_payment_method && isVerified) {
        status = "ready_release";
      } else if (proof.offer_otp_verified && isVerified && !proof.offer_traveler_payment_method) {
        status = "traveler_pending";
      } else if (isVerified) {
        status = "buyer_approved";
      } else {
        status = "buyer_pending";
      }

      cards.push({
        id: key,
        buyerProof: proof,
        travelerPayment: offerTravelerPayment,
        status,
      });
    }

    // Also add any pending payments that don't have a proof
    for (const payment of pendingPayments) {
      const existingCard = cards.find(c => c.id === payment.id || c.id === payment.offerer_id);
      if (!existingCard) {
        cards.push({
          id: payment.id,
          travelerPayment: payment,
          status: payment.payment_released ? "released" :
            payment.traveler_payment_method ? "ready_release" : "traveler_pending",
        });
      }
    }

    // Filter based on showReleased toggle
    if (!showReleased) {
      return cards.filter(card => card.status !== "released");
    }
    return cards;
  };
  
  const [showReleased, setShowReleased] = useState(false);

  const orderCards = buildOrderCards();

  const getStatusBadge = (status: OrderCard["status"]) => {
    switch (status) {
      case "buyer_pending":
        return <Badge className="bg-amber/20 text-amber text-[10px]">Buyer Payment</Badge>;
      case "buyer_approved":
        return <Badge className="bg-blue/20 text-blue text-[10px]">Awaiting Delivery</Badge>;
      case "traveler_pending":
        return <Badge className="bg-blue/20 text-blue text-[10px]">Traveler Info</Badge>;
      case "ready_release":
        return <Badge className="bg-emerald/20 text-emerald text-[10px]">Ready to Release</Badge>;
      case "released":
        return <Badge className="bg-white/10 text-muted text-[10px]">Released</Badge>;
    }
  };

  const verifyPayment = async (proofId: string, offerId: string, approve: boolean) => {
    setLoading(true);
    try {
      await authedJsonFetch("/api/admin/verify-payment", {
        method: "POST",
        body: JSON.stringify({ proofId, offerId, approve })
      });
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const releasePayment = async (offerId: string) => {
    setLoading(true);
    try {
      await authedJsonFetch("/api/escrow/release", {
        method: "POST",
        body: JSON.stringify({ offerId })
      });
      await loadAdminData();
      setSelectedOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Release failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <DashboardGuard adminOnly>
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          {error && <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">{error}</p>}

          {/* Platform Revenue Stats */}
          {adminStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-emerald/5 border-emerald/20">
                <p className="text-xs text-muted uppercase tracking-wide">Platform Fees Collected</p>
                <p className="text-2xl font-bold text-emerald mt-1">
                  {adminStats.totalFees.toFixed(2)} TND
                </p>
                <p className="text-xs text-muted mt-1">Admin revenue</p>
              </Card>
              <Card className="p-4 bg-blue/5 border-blue/20">
                <p className="text-xs text-muted uppercase tracking-wide">Paid to Travelers</p>
                <p className="text-2xl font-bold text-blue mt-1">
                  {adminStats.totalTravelerEarnings.toFixed(2)} TND
                </p>
                <p className="text-xs text-muted mt-1">Total earnings</p>
              </Card>
              <Card className="p-4 bg-electricBlue/5 border-electricBlue/20">
                <p className="text-xs text-muted uppercase tracking-wide">Total Volume</p>
                <p className="text-2xl font-bold text-electricBlue mt-1">
                  {adminStats.totalVolume.toFixed(2)} TND
                </p>
                <p className="text-xs text-muted mt-1">Gross payments</p>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Order Cards List */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-electricBlue" />
                  Orders
                </h2>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showReleased}
                      onChange={(e) => setShowReleased(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-muted">Show released</span>
                  </label>
                  <Button 
                    variant="secondary" 
                    className="h-8 w-8 p-0"
                    onClick={() => void loadAdminData()}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {orderCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedOrder(card)}
                    className={`w-full text-left rounded-xl border p-3 transition-all hover:border-white/20 ${
                      selectedOrder?.id === card.id ? "border-electricBlue bg-electricBlue/5" : "border-white/10 bg-white/5"
                    }`
                  }
                  >
                    <div className="flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {card.buyerProof?.buyer?.full_name || card.travelerPayment?.buyer?.full_name || "Unknown"}
                          </p>
                          {getStatusBadge(card.status)}
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">
                          {card.buyerProof?.amount_tnd?.toFixed(2) || card.travelerPayment?.amount_tnd?.toFixed(2) || "0.00"} TND
                          {card.travelerPayment?.traveler_payment_method && ` · ${card.travelerPayment.traveler_payment_method.toUpperCase()}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted shrink-0" />
                    </div>
                  </button>
                ))}
                {orderCards.length === 0 && (
                  <p className="text-sm text-muted text-center py-8 italic">No orders yet.</p>
                )}
              </div>
            </Card>

            {/* Detail Panel */}
            <div className="space-y-4">
              {selectedOrder ? (
                <Card className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg">Order Details</h2>
                    <button onClick={() => setSelectedOrder(null)} className="text-muted hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {getStatusBadge(selectedOrder.status)}

                  {/* Buyer Payment Section */}
                  {selectedOrder.buyerProof && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-electricBlue" />
                        Buyer Payment
                      </h3>
                      <div className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{selectedOrder.buyerProof.buyer?.full_name || "Unknown"}</p>
                            <p className="text-[10px] text-muted">{selectedOrder.buyerProof.provider}</p>
                          </div>
                          <span className="text-sm font-bold text-electricBlue">
                            {selectedOrder.buyerProof.amount_tnd.toFixed(2)} TND
                          </span>
                        </div>

                        <div className="flex gap-3">
                          {selectedOrder.buyerProof.image_url ? (
                            <a href={selectedOrder.buyerProof.image_url} target="_blank" rel="noreferrer" className="block">
                              <div className="w-28 h-28 rounded-lg overflow-hidden border border-white/10 hover:border-electricBlue transition-colors">
                                <img src={selectedOrder.buyerProof.image_url} alt="Proof" className="w-full h-full object-cover" />
                              </div>
                            </a>
                          ) : (
                            <div className="w-28 h-28 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                              <CreditCard className="h-8 w-8 text-electricBlue/50" />
                            </div>
                          )}
                          <div className="space-y-1 text-xs">
                            <p className="text-muted">TRX: <span className="text-white font-mono">{selectedOrder.buyerProof.transaction_id}</span></p>
                            <p className="text-muted">{new Date(selectedOrder.buyerProof.created_at).toLocaleString()}</p>
                            {selectedOrder.buyerProof.provider === "konnect" && (
                              <Badge className="bg-electricBlue/20 text-electricBlue text-[10px]">Konnect Payment</Badge>
                            )}
                          </div>
                        </div>

                        {selectedOrder.buyerProof.id?.startsWith("synthetic_") ? (
                          <div className="flex items-center gap-2 text-electricBlue text-xs font-medium">
                            <CreditCard className="h-4 w-4" />
                            Konnect Payment (Auto-verified)
                          </div>
                        ) : !selectedOrder.buyerProof.verified ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => void verifyPayment(selectedOrder.buyerProof!.id, selectedOrder.buyerProof!.offer_id, true)}
                              disabled={loading}
                              className="flex-1 bg-emerald hover:bg-emerald/80 h-8 text-xs"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => void verifyPayment(selectedOrder.buyerProof!.id, selectedOrder.buyerProof!.offer_id, false)}
                              disabled={loading}
                              variant="secondary"
                              className="flex-1 h-8 text-xs"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald text-xs font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Payment Verified
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Traveler Payment Section */}
                  {selectedOrder.travelerPayment && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-emerald" />
                        Traveler Payment
                      </h3>
                      <div className="rounded-xl border border-emerald/30 p-3 bg-emerald/5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{selectedOrder.travelerPayment.traveler?.full_name || "Unknown"}</p>
                            <p className="text-[10px] text-muted">Traveler</p>
                          </div>
                          <span className="text-sm font-bold text-emerald">
                            {selectedOrder.travelerPayment.amount_tnd?.toFixed(2)} TND
                          </span>
                        </div>

                        {selectedOrder.travelerPayment.traveler_payment_method ? (
                          <div className="bg-white/5 rounded-lg p-3 space-y-2">
                            <p className="text-[10px] text-muted uppercase tracking-wider">Send payment to:</p>
                            <div className="flex items-center gap-2">
                              {selectedOrder.travelerPayment.traveler_payment_method === "d17" ? (
                                <Smartphone className="h-4 w-4 text-emerald" />
                              ) : (
                                <CreditCard className="h-4 w-4 text-electricBlue" />
                              )}
                              <span className="font-medium">{selectedOrder.travelerPayment.traveler_payment_method.toUpperCase()}</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-mono">{selectedOrder.travelerPayment.traveler_payment_number}</p>
                              {selectedOrder.travelerPayment.traveler_payment_name && (
                                <p className="text-xs text-muted">{selectedOrder.travelerPayment.traveler_payment_name}</p>
                              )}
                            </div>
                            {/* Fee Breakdown */}
                            {(() => {
                              const amount = selectedOrder.travelerPayment?.amount_tnd || 0;
                              const feeRate = amount > 800 ? 2 : amount > 500 ? 3 : 5;
                              const fee = amount * (feeRate / 100);
                              const net = amount - fee;
                              return (
                                <div className="border-t border-white/10 pt-2 mt-2 space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted">Total Amount:</span>
                                    <span>{amount.toFixed(2)} TND</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted">Platform Fee ({feeRate}%):</span>
                                    <span className="text-amber">-{fee.toFixed(2)} TND</span>
                                  </div>
                                  <div className="flex justify-between text-xs font-medium border-t border-white/10 pt-1">
                                    <span className="text-emerald">Traveler Receives:</span>
                                    <span className="text-emerald">{net.toFixed(2)} TND</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber text-xs">
                            <Clock className="h-4 w-4" />
                            Waiting for traveler to provide payment info
                          </div>
                        )}

                        {selectedOrder.travelerPayment.traveler_payment_method && selectedOrder.buyerProof?.verified ? (
                          <Button
                            className="w-full bg-emerald hover:bg-emerald/80 h-9"
                            disabled={loading}
                            onClick={() => void releasePayment(selectedOrder.travelerPayment!.id)}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Release Payment
                          </Button>
                        ) : !selectedOrder.buyerProof?.verified ? (
                          <div className="flex items-center gap-2 text-amber text-xs p-2 bg-amber/10 rounded-lg">
                            <AlertCircle className="h-4 w-4" />
                            Approve buyer payment first
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* No traveler payment info yet - waiting for traveler to provide D17/Flouci */}
                  {selectedOrder.travelerPayment && !selectedOrder.travelerPayment.traveler_payment_method && selectedOrder.buyerProof?.verified && (
                    <div className="rounded-xl border border-white/10 p-3 bg-white/5">
                      <div className="flex items-center gap-2 text-amber text-xs">
                        <Clock className="h-4 w-4" />
                        Awaiting traveler payment info. The traveler needs to provide D17/Flouci details after delivery.
                      </div>
                    </div>
                  )}
                  {/* Buyer approved but no traveler data at all - delivery in progress */}
                  {!selectedOrder.travelerPayment && selectedOrder.buyerProof?.verified && (
                    <div className="rounded-xl border border-white/10 p-3 bg-white/5">
                      <div className="flex items-center gap-2 text-blue text-xs">
                        <Clock className="h-4 w-4" />
                        Payment verified. Delivery in progress - waiting for OTP confirmation.
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="space-y-2 flex items-center justify-center py-12">
                  <p className="text-sm text-muted">Select an order to view details</p>
                </Card>
              )}

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
                  <Button onClick={async () => {
                    try {
                      await authedJsonFetch("/api/escrow/release", {
                        method: "POST",
                        body: JSON.stringify({ orderId: selectedOrderId })
                      });
                      await loadAdminData();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Release failed.");
                    }
                  }}>Release Escrow</Button>
                  <Button variant="secondary" onClick={async () => {
                    try {
                      await authedJsonFetch("/api/escrow/refund", {
                        method: "POST",
                        body: JSON.stringify({ orderId: selectedOrderId, reason: refundReason })
                      });
                      await loadAdminData();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Refund failed.");
                    }
                  }}>
                    Refund Escrow
                  </Button>
                </div>
              </Card>

              <Card className="space-y-2">
                <h2 className="font-medium">Recent Orders</h2>
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-white/10 p-3 bg-white/5">
                      <p className="text-[10px] text-muted">ID: {order.id}</p>
                      <p className="text-sm font-medium">
                        {order.origin} → {order.destination}
                      </p>
                      <p className="text-[10px] uppercase text-amber font-bold">Status: {order.status}</p>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-sm text-muted">No orders found.</p>}
                </div>
              </Card>
            </div>
          </div>

          <Card className="space-y-2">
            <h2 className="font-medium">Disputes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="rounded-xl border border-white/10 p-3 bg-white/5">
                  <p className="text-[10px] text-muted">Dispute: {dispute.id}</p>
                  <p className="text-xs">Order: {dispute.order_id}</p>
                  <p className="text-sm mt-1">{dispute.reason}</p>
                  <p className="text-[10px] uppercase text-rose-400 font-bold mt-2">Status: {dispute.status}</p>
                </div>
              ))}
            </div>
            {disputes.length === 0 && <p className="text-sm text-muted text-center py-4">No disputes found.</p>}
          </Card>
        </section>
      </DashboardGuard>
    </AppShell>
  );
}
