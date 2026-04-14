"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, CheckCircle2, ExternalLink, Wallet, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/lib/use-auth-session";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number; // in TND
  currency?: string;
  offerId: string;
  buyerId: string;
  travelerId: string;
  itemDescription: string;
  onPaymentSuccess: (paymentRef: string) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  offerId,
  buyerId,
  travelerId,
  itemDescription,
  onPaymentSuccess
}: PaymentModalProps): JSX.Element | null {
  const { user } = useAuthSession();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  // Create Konnect payment when modal opens
  const createPayment = async () => {
    if (!isOpen || paymentUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          offerId,
          buyerId,
          travelerId,
          buyerEmail: user?.email,
          buyerName: user?.user_metadata?.full_name || "",
          itemDescription
        })
      });
      
      const data = await res.json();
      if (data.payUrl) {
        setPaymentUrl(data.payUrl);
        setPaymentRef(data.paymentRef);
        setIsMockMode(data.mockMode || false);
      } else {
        setError(data.error || "Failed to create payment");
      }
    } catch (err) {
      setError("Failed to initialize payment");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-create payment when modal opens
  if (isOpen && !paymentUrl && !isLoading && !error) {
    createPayment();
  }

  const handleOpenPayment = () => {
    if (paymentUrl) {
      // Open Konnect payment page in new tab
      window.open(paymentUrl, "_blank");
    }
  };

  const handleConfirmPayment = () => {
    if (paymentRef) {
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess(paymentRef);
        onClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    setPaymentUrl(null);
    setPaymentRef(null);
    setSuccess(false);
    setError(null);
    setIsMockMode(false);
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
                <Wallet className="h-5 w-5 text-electricBlue" />
                <h2 className="text-lg font-semibold">Konnect Payment</h2>
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
              {success ? (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-emerald/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="h-8 w-8 text-emerald" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">Payment Confirmed!</h3>
                  <p className="text-muted">
                    Your payment is secured. The traveler will be notified to proceed with delivery.
                  </p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-electricBlue/30 border-t-electricBlue rounded-full mx-auto mb-4" />
                  <p className="text-muted">Creating secure payment...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-rose-300 mb-4">{error}</div>
                  <Button onClick={createPayment} variant="secondary">
                    Try Again
                  </Button>
                </div>
              ) : paymentUrl ? (
                <div className="space-y-6">
                  {/* Mock Mode Warning */}
                  {isMockMode && (
                    <div className="bg-amber/20 border border-amber/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-amber">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium text-sm">TEST MODE</span>
                      </div>
                      <p className="text-xs text-amber/80 mt-1">
                        Konnect sandbox is down. Using mock payment for testing.
                      </p>
                    </div>
                  )}
                  
                  {/* Amount Display */}
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-sm text-muted mb-1">Total Amount</p>
                    <p className="text-3xl font-bold">{amount.toFixed(2)} TND</p>
                    <p className="text-xs text-muted mt-1">{itemDescription}</p>
                  </div>

                  {/* Payment Methods - hide in mock mode */}
                  {!isMockMode && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted text-center">Accepted payment methods:</p>
                      <div className="flex justify-center gap-2">
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-xs">Bank Card</span>
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-xs">e-DINAR</span>
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-xs">Wallet</span>
                      </div>
                    </div>
                  )}

                  {/* Escrow Info */}
                  <div className="flex items-center gap-2 text-sm text-emerald bg-emerald/10 rounded-lg p-3">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Payment held until delivery confirmation</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleOpenPayment}
                      className="w-full bg-electricBlue gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {isMockMode ? "Open Test Payment Page" : "Open Konnect Payment Page"}
                    </Button>
                    
                    <p className="text-xs text-muted text-center">
                      {isMockMode 
                        ? "Simulate payment on the test page, then click below:" 
                        : "After completing payment on Konnect, click below:"}
                    </p>
                    
                    <Button
                      onClick={handleConfirmPayment}
                      variant="secondary"
                      className="w-full gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      I've Completed Payment
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
