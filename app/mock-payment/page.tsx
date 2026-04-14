"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, XCircle, Wallet, AlertTriangle } from "lucide-react";

export default function MockPaymentPage(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<"success" | "fail" | null>(null);

  const ref = searchParams.get("ref");
  const amount = searchParams.get("amount");
  const desc = searchParams.get("desc");

  const handleSuccess = async () => {
    setIsProcessing(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    setResult("success");
    setIsProcessing(false);
  };

  const handleFail = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setResult("fail");
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (result === "success") {
      // Redirect back to messages with success
      const params = new URLSearchParams();
      params.set("payment", "success");
      if (ref) params.set("ref", ref);
      window.location.href = `/messages?${params.toString()}`;
    } else {
      window.location.href = "/messages?payment=failed";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#050505] to-[#0a0a0a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden">
          {/* Banner */}
          <div className="bg-amber/20 border-b border-amber/30 p-4">
            <div className="flex items-center gap-2 text-amber">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">TEST MODE - No Real Money</span>
            </div>
            <p className="text-xs text-amber/80 mt-1">
              Konnect sandbox is down. Using mock payment for testing.
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {!result ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-electricBlue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-electricBlue" />
                  </div>
                  <h1 className="text-2xl font-bold mb-1">Mock Payment</h1>
                  <p className="text-muted">Simulate Konnect payment flow</p>
                </div>

                {/* Amount */}
                <div className="bg-white/5 rounded-xl p-4 text-center mb-6">
                  <p className="text-sm text-muted mb-1">Amount</p>
                  <p className="text-3xl font-bold">{amount} TND</p>
                  <p className="text-xs text-muted mt-1">{desc}</p>
                </div>

                <p className="text-sm text-center text-muted mb-6">
                  Click below to simulate payment result:
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSuccess}
                    disabled={isProcessing}
                    className="w-full bg-emerald hover:bg-emerald/80 gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Simulate Success
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleFail}
                    disabled={isProcessing}
                    variant="secondary"
                    className="w-full gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Simulate Failure
                  </Button>
                </div>
              </>
            ) : result === "success" ? (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-emerald/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald" />
                </motion.div>
                <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
                <p className="text-muted mb-4">
                  Mock payment completed. Funds will be held in escrow.
                </p>
                <p className="text-xs text-muted mb-6">
                  Ref: {ref}
                </p>
                <Button onClick={handleClose} className="w-full bg-electricBlue">
                  Return to App
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-rose-400/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <XCircle className="h-8 w-8 text-rose-400" />
                </motion.div>
                <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>
                <p className="text-muted mb-4">
                  Mock payment was declined.
                </p>
                <Button onClick={handleClose} variant="secondary" className="w-full">
                  Return to App
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
