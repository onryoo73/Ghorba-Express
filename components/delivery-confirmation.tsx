"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, CheckCircle2, Package, Scan, Smartphone, ShieldCheck, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

interface DeliveryConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  paymentIntentId: string;
  buyerId: string;
  travelerId: string;
  itemDescription: string;
  mode: "generate" | "scan"; // generate = buyer shows QR, scan = traveler scans QR
  onConfirmed: () => void;
}

export function DeliveryConfirmation({
  isOpen,
  onClose,
  offerId,
  paymentIntentId,
  buyerId,
  travelerId,
  itemDescription,
  mode,
  onConfirmed
}: DeliveryConfirmationProps): JSX.Element | null {
  const [qrData, setQrData] = useState<string>("");
  const [scanInput, setScanInput] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate QR code data
  useEffect(() => {
    if (!isOpen || mode !== "generate") return;
    
    const data = JSON.stringify({
      offerId,
      paymentIntentId,
      buyerId,
      travelerId,
      timestamp: Date.now(),
      type: "delivery_confirmation"
    });
    
    // Encode for URL safety
    const encoded = btoa(data);
    setQrData(`${window.location.origin}/confirm-delivery?data=${encoded}`);
  }, [isOpen, mode, offerId, paymentIntentId, buyerId, travelerId]);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    setIsConfirming(true);
    setError(null);

    try {
      // Parse QR data
      const url = new URL(scanInput);
      const encodedData = url.searchParams.get("data");
      if (!encodedData) throw new Error("Invalid QR code");

      const decoded = JSON.parse(atob(encodedData));
      
      // Verify data matches
      if (decoded.offerId !== offerId || decoded.paymentIntentId !== paymentIntentId) {
        throw new Error("QR code doesn't match this delivery");
      }

      // Call API to capture payment
      const res = await fetch("/api/capture-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId })
      });

      if (!res.ok) throw new Error("Failed to release payment");

      // Update offer status in database
      if (supabase) {
        await supabase
          .from("post_offers")
          .update({ 
            status: "completed",
            completed_at: new Date().toISOString()
          })
          .eq("id", offerId);
      }

      setConfirmed(true);
      setTimeout(() => {
        onConfirmed();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm delivery");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setScanInput("");
    setError(null);
    setConfirmed(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                {mode === "generate" ? (
                  <Package className="h-5 w-5 text-electricBlue" />
                ) : (
                  <Scan className="h-5 w-5 text-emerald" />
                )}
                <h2 className="text-lg font-semibold">
                  {mode === "generate" ? "Confirm Receipt" : "Scan & Deliver"}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {confirmed ? (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-emerald/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="h-10 w-10 text-emerald" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">
                    {mode === "generate" ? "Delivery Confirmed!" : "Payment Released!"}
                  </h3>
                  <p className="text-muted">
                    {mode === "generate" 
                      ? "Your item has been delivered and verified." 
                      : "Funds have been released to your account."}
                  </p>
                </div>
              ) : mode === "generate" ? (
                // Buyer shows QR code
                <div className="text-center">
                  <p className="text-muted mb-4">
                    Show this QR code to the traveler to confirm delivery
                  </p>
                  
                  <div className="bg-white p-4 rounded-xl inline-block mb-4">
                    {qrData && (
                      <QRCodeSVG 
                        value={qrData} 
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-muted">
                    <p className="flex items-center justify-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald" />
                      <span>Payment held in escrow</span>
                    </p>
                    <p className="font-medium text-foreground">{itemDescription}</p>
                  </div>
                </div>
              ) : (
                // Traveler scans QR code
                <div>
                  <p className="text-muted mb-4 text-center">
                    Scan the buyer's QR code to complete delivery and receive payment
                  </p>

                  <form onSubmit={handleScanSubmit} className="space-y-4">
                    <div className="relative">
                      <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                      <input
                        type="text"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        placeholder="Paste scanned QR code URL..."
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-electricBlue"
                      />
                    </div>

                    {error && (
                      <div className="text-sm text-rose-300 bg-rose-400/10 rounded-lg p-3">
                        {error}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-emerald bg-emerald/10 rounded-lg p-3">
                      <ShieldCheck className="h-4 w-4" />
                      <span>You'll receive payment immediately after confirmation</span>
                    </div>

                    <Button
                      type="submit"
                      disabled={!scanInput.trim() || isConfirming}
                      className="w-full bg-emerald hover:bg-emerald/80"
                    >
                      {isConfirming ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Confirming...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Confirm Delivery & Get Paid
                        </span>
                      )}
                    </Button>
                  </form>

                  <p className="text-xs text-muted text-center mt-4">
                    Or use your phone camera to scan the QR code directly
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
