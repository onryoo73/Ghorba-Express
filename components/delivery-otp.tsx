"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Package, KeyRound, ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PostOffer } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/client";

interface DeliveryOTPProps {
  isOpen: boolean;
  onClose: () => void;
  offer: PostOffer;
  mode: "buyer" | "traveler"; // buyer = sees OTP, traveler = enters OTP
  userId: string;
  onConfirmed: () => void;
  onStageChange?: (stage: "traveler_confirmed" | "buyer_confirmed") => void;
}

export function DeliveryOTP({
  isOpen,
  onClose,
  offer,
  mode,
  userId,
  onConfirmed,
  onStageChange
}: DeliveryOTPProps): JSX.Element | null {
  const [otpInput, setOtpInput] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState<string | null>(offer.delivery_otp || null); // Initialize from offer if available
  const [deliveryStage, setDeliveryStage] = useState<
    "traveler_confirm" | "buyer_confirm" | "otp_reveal" | "otp_verify" | "waiting_buyer" | "waiting_traveler"
  >(() => {
    if (mode === "traveler") {
      // Traveler flow: already verified OTP
      if (offer.otp_verified) return "otp_verify";
      // Traveler flow: buyer already confirmed, show OTP input
      if (offer.buyer_confirmed_receipt) return "otp_verify";
      // Traveler flow: traveler already confirmed delivery, waiting for buyer
      if (offer.traveler_confirmed_delivery) return "waiting_buyer";
      // Traveler flow: initial state - need to confirm delivery
      return "traveler_confirm";
    }
    // Buyer mode: already confirmed receipt, show OTP
    if (offer.buyer_confirmed_receipt) return "otp_reveal";
    // Buyer mode: traveler confirmed, waiting for buyer to confirm
    if (offer.traveler_confirmed_delivery) return "buyer_confirm";
    // Buyer mode: initial state - waiting for traveler
    return "waiting_traveler";
  });

  const handleTravelerConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get auth token
      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
      const token = session?.access_token;
      
      const res = await fetch("/api/offers/confirm-delivery", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ offerId: offer.id })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to confirm delivery");
      }

      // Move to waiting state - buyer needs to confirm
      setDeliveryStage("waiting_buyer");
      onStageChange?.("traveler_confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyerConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get auth token
      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
      const token = session?.access_token;
      
      const res = await fetch("/api/offers/confirm-receipt", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ offerId: offer.id })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to confirm receipt");
      }

      const data = await res.json();
      console.log("[DeliveryOTP] API response:", data);
      console.log("[DeliveryOTP] Setting OTP to:", data.otp);
      setOtp(data.otp); // Now reveal OTP after buyer confirms
      setDeliveryStage("otp_reveal");
      onStageChange?.("buyer_confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      // Get auth token
      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
      const token = session?.access_token;
      
      const res = await fetch("/api/offers/verify-otp", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ offerId: offer.id, otp: otpInput.trim() })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Invalid OTP");
      }

      setConfirmed(true);
      setTimeout(() => {
        onConfirmed();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOtpInput("");
    setError(null);
    setConfirmed(false);
    onClose();
  };

  // Reset state when modal opens with fresh offer data
  useEffect(() => {
    if (!isOpen) return;
    
    // Recalculate initial stage based on latest offer data
    if (mode === "traveler") {
      if (offer.otp_verified || offer.buyer_confirmed_receipt) {
        setDeliveryStage("otp_verify");
      } else if (offer.traveler_confirmed_delivery) {
        setDeliveryStage("waiting_buyer");
      } else {
        setDeliveryStage("traveler_confirm");
      }
    } else {
      // buyer mode
      if (offer.buyer_confirmed_receipt) {
        setDeliveryStage("otp_reveal");
      } else if (offer.traveler_confirmed_delivery) {
        setDeliveryStage("buyer_confirm");
      } else {
        setDeliveryStage("waiting_traveler");
      }
    }
    
    // Reset OTP visibility and update from offer data
    setShowOtp(false);
    setOtpInput("");
    setError(null);
    if (offer.delivery_otp) {
      setOtp(offer.delivery_otp);
    }
  }, [isOpen, mode, offer.id, offer.delivery_otp]);

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
                {mode === "buyer" ? (
                  <Package className="h-5 w-5 text-electricBlue" />
                ) : (
                  <KeyRound className="h-5 w-5 text-emerald" />
                )}
                <h2 className="text-lg font-semibold">
                  {mode === "buyer" ? "Delivery Confirmation" : "Receive Payment"}
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
                    {mode === "buyer" ? "Delivery Confirmed!" : "Payment Released!"}
                  </h3>
                  <p className="text-muted">
                    {mode === "buyer" 
                      ? "Your item has been delivered successfully." 
                      : "Funds have been released to your account."}
                  </p>
                </div>
              ) : mode === "buyer" ? (
                // Buyer flow
                <div className="text-center space-y-4">
                  {deliveryStage === "waiting_traveler" ? (
                    <>
                      <div className="w-16 h-16 bg-amber/20 rounded-full flex items-center justify-center mx-auto">
                        <Loader2 className="h-8 w-8 text-amber animate-spin" />
                      </div>
                      <p className="text-muted">
                        Waiting for traveler to confirm delivery...
                      </p>
                      <p className="text-xs text-muted">
                        Once the traveler confirms they delivered the item, you will be able to confirm receipt and reveal your OTP.
                      </p>
                    </>
                  ) : deliveryStage === "buyer_confirm" ? (
                    <>
                      <div className="w-16 h-16 bg-electricBlue/20 rounded-full flex items-center justify-center mx-auto">
                        <Package className="h-8 w-8 text-electricBlue" />
                      </div>
                      <p className="text-muted">
                        The traveler has marked the item as delivered. Please confirm receipt to reveal the OTP.
                      </p>
                      
                      {error && (
                        <div className="text-sm text-rose-300 bg-rose-400/10 rounded-lg p-3">
                          {error}
                        </div>
                      )}

                      <Button
                        onClick={handleBuyerConfirm}
                        disabled={loading}
                        className="w-full bg-electricBlue hover:bg-electricBlue/80"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Confirming...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            I Received the Item
                          </span>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-emerald/20 rounded-full flex items-center justify-center mx-auto">
                        <KeyRound className="h-8 w-8 text-emerald" />
                      </div>
                      
                      <p className="text-muted">
                        Show this 6-digit code to the traveler to complete delivery:
                      </p>

                      <div className="relative">
                        <div className="bg-emerald/10 border-2 border-emerald/30 rounded-xl p-4 flex items-center justify-center gap-2">
                          <span className="text-3xl font-mono font-bold tracking-widest text-emerald">
                            {showOtp ? otp : "••••••"}
                          </span>
                          <button
                            onClick={() => setShowOtp(!showOtp)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-2"
                          >
                            {showOtp ? (
                              <EyeOff className="h-5 w-5 text-muted" />
                            ) : (
                              <Eye className="h-5 w-5 text-muted" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-emerald bg-emerald/10 rounded-lg p-3">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Payment will be released after traveler enters this code</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Traveler flow
                <div className="space-y-4">
                  {deliveryStage === "traveler_confirm" ? (
                    <>
                      <div className="w-16 h-16 bg-electricBlue/20 rounded-full flex items-center justify-center mx-auto">
                        <Package className="h-8 w-8 text-electricBlue" />
                      </div>
                      <p className="text-muted text-center">
                        Have you delivered the item to the buyer? Confirm to proceed.
                      </p>
                      
                      {error && (
                        <div className="text-sm text-rose-300 bg-rose-400/10 rounded-lg p-3">
                          {error}
                        </div>
                      )}

                      <Button
                        onClick={handleTravelerConfirm}
                        disabled={loading}
                        className="w-full bg-electricBlue hover:bg-electricBlue/80"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Confirming...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            I Delivered the Item
                          </span>
                        )}
                      </Button>
                    </>
                  ) : deliveryStage === "waiting_buyer" ? (
                    <>
                      <div className="w-16 h-16 bg-amber/20 rounded-full flex items-center justify-center mx-auto">
                        <Loader2 className="h-8 w-8 text-amber animate-spin" />
                      </div>
                      <p className="text-muted text-center">
                        You confirmed delivery. Waiting for buyer to confirm receipt...
                      </p>
                      <p className="text-xs text-muted text-center">
                        Once the buyer confirms they received the item, they will reveal the 6-digit OTP code for you to enter.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-emerald/20 rounded-full flex items-center justify-center mx-auto">
                        <KeyRound className="h-8 w-8 text-emerald" />
                      </div>
                      
                      <p className="text-muted text-center">
                        Enter the 6-digit code from the buyer to release payment:
                      </p>

                      <div className="relative">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                          className="w-full text-center text-2xl font-mono font-bold tracking-widest py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald"
                        />
                      </div>

                      {error && (
                        <div className="text-sm text-rose-300 bg-rose-400/10 rounded-lg p-3 text-center">
                          {error}
                        </div>
                      )}

                      <Button
                        onClick={handleVerifyOtp}
                        disabled={otpInput.length !== 6 || loading}
                        className="w-full bg-emerald hover:bg-emerald/80"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Verify & Get Paid
                          </span>
                        )}
                      </Button>

                      <p className="text-xs text-muted text-center">
                        Ask the buyer to show you the 6-digit code from their app
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
