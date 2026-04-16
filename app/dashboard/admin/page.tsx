"use client";

import { Wallet, CheckCircle2 } from "lucide-react";
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

interface PaymentProof {
  id: string;
  offer_id: string;
  buyer_id: string;
  provider: string;
  image_url: string;
  amount_tnd: number;
  transaction_id: string;
  verified: boolean;
  created_at: string;
  buyer?: { full_name: string };
}

export default function AdminDashboardPage(): JSX.Element {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAdminData = async () => {
    try {
      const [ordersResult, disputesResult] = await Promise.all([
        authedJsonFetch<{ orders: OrderRow[] }>("/api/admin/orders"),
        authedJsonFetch<{ disputes: DisputeRow[] }>("/api/admin/disputes")
      ]);
      setOrders(ordersResult.orders);
      setDisputes(disputesResult.disputes);
      
      // Fetch payment proofs directly from Supabase for simplicity in this MVP
      const { data: proofs, error: proofsError } = await authedJsonFetch<{ data: PaymentProof[] }>("/api/admin/payment-proofs");
      if (proofsError) throw new Error("Failed to load payment proofs");
      setPaymentProofs(proofs || []);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

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

  return (
    <AppShell>
      <DashboardGuard adminOnly>
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          {error && <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-electricBlue" />
                Payment Verifications
              </h2>
              <div className="space-y-3">
                {paymentProofs.map((proof) => (
                  <div key={proof.id} className="rounded-xl border border-white/10 p-4 bg-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{proof.buyer?.full_name || "Unknown Buyer"}</p>
                        <p className="text-xs text-muted">Offer: {proof.offer_id}</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-amber/20 text-amber text-[10px] font-bold uppercase">
                        {proof.provider}
                      </span>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <a href={proof.image_url} target="_blank" rel="noreferrer">
                          <img src={proof.image_url} alt="Proof" className="w-full h-full object-cover" />
                        </a>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-electricBlue">{proof.amount_tnd.toFixed(2)} TND</p>
                        <p className="text-xs text-muted">TRX ID: <span className="text-white">{proof.transaction_id}</span></p>
                        <p className="text-[10px] text-muted">{new Date(proof.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {!proof.verified && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => void verifyPayment(proof.id, proof.offer_id, true)}
                          disabled={loading}
                          className="flex-1 bg-emerald hover:bg-emerald/80 h-8 text-xs"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => void verifyPayment(proof.id, proof.offer_id, false)}
                          disabled={loading}
                          variant="secondary"
                          className="flex-1 h-8 text-xs"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {proof.verified && (
                      <div className="flex items-center gap-2 text-emerald text-xs font-medium pt-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Verified
                      </div>
                    )}
                  </div>
                ))}
                {paymentProofs.length === 0 && (
                  <p className="text-sm text-muted text-center py-8 italic">No pending payments to verify.</p>
                )}
              </div>
            </Card>

            <div className="space-y-4">
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
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
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
