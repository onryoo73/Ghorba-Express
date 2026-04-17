"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Smartphone, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

interface TravelerPaymentInfoProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  onSuccess: () => void;
}

type PaymentMethod = "d17" | "flouci" | "bank_transfer";

export function TravelerPaymentInfo({
  isOpen,
  onClose,
  offerId,
  onSuccess
}: TravelerPaymentInfoProps): JSX.Element | null {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!paymentMethod || !paymentNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }
    
    if (paymentMethod === "flouci" && !paymentName.trim()) {
      setError("Please enter your Flouci account name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };
      const token = session?.access_token;
      
      const res = await fetch("/api/offers/traveler-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          offerId,
          paymentMethod,
          paymentNumber: paymentNumber.trim(),
          paymentName: paymentName.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save payment info");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to save payment info:", err);
      setError(err instanceof Error ? err.message : "Failed to save payment info");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
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
                <div className="p-2 rounded-lg bg-emerald/20">
                  <Wallet className="h-5 w-5 text-emerald" />
                </div>
                <div>
                  <h3 className="font-semibold">Payment Details</h3>
                  <p className="text-xs text-muted">How should we send your money?</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!success ? (
              <div className="p-4 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("d17")}
                      className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                        paymentMethod === "d17"
                          ? "border-emerald bg-emerald/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <Smartphone className="h-6 w-6 text-emerald" />
                      <span className="text-sm font-medium">D17</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("flouci")}
                      className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                        paymentMethod === "flouci"
                          ? "border-electricBlue bg-electricBlue/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <CreditCard className="h-6 w-6 text-electricBlue" />
                      <span className="text-sm font-medium">Flouci</span>
                    </button>
                  </div>
                </div>

                {/* Payment Details */}
                {paymentMethod && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="text-sm text-muted mb-1.5 block">
                        {paymentMethod === "d17" ? "D17 Phone Number" : "Flouci Phone Number"}
                      </label>
                      <Input
                        type="tel"
                        placeholder="+216 XX XXX XXX"
                        value={paymentNumber}
                        onChange={(e) => setPaymentNumber(e.target.value)}
                        className="bg-white/5"
                      />
                      <p className="text-xs text-muted mt-1">
                        {paymentMethod === "d17" 
                          ? "Enter the phone number linked to your D17 account" 
                          : "Enter the phone number linked to your Flouci account"}
                      </p>
                    </div>
                    
                    {/* Only show name field for Flouci - D17 uses phone number as identifier */}
                    {paymentMethod === "flouci" && (
                      <div>
                        <label className="text-sm text-muted mb-1.5 block">Flouci Account Name</label>
                        <Input
                          type="text"
                          placeholder="Name on your Flouci account"
                          value={paymentName}
                          onChange={(e) => setPaymentName(e.target.value)}
                          className="bg-white/5"
                        />
                        <p className="text-xs text-muted mt-1">
                          This helps the admin verify they're sending to the correct account
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !paymentMethod || !paymentNumber.trim() || (paymentMethod === "flouci" && !paymentName.trim())}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {loading ? "Saving..." : "Confirm Payment Details"}
                </Button>

                <p className="text-xs text-muted text-center">
                  Admin will use these details to release your payment
                </p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">Payment Info Saved!</h3>
                <p className="text-sm text-muted mb-4">
                  Admin will release your payment to this account shortly.
                </p>
                <div className="p-4 rounded-xl bg-amber/10 border border-amber/30">
                  <p className="text-sm text-amber">
                    Release may take up to 10 minutes. Please wait...
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
