import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, CheckCircle2, ExternalLink, Wallet, AlertTriangle, DollarSign, Calculator, Edit2, Check, Smartphone, Landmark, ImagePlus, Upload, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/lib/use-auth-session";
import { supabase } from "@/lib/supabase/client";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreedAmount: number; // Amount buyer and traveler agreed on (traveler receives this)
  offerId: string;
  buyerId: string;
  travelerId: string;
  itemDescription: string;
  onAgreedAmountUpdate?: (amount: string) => void; // To update parent state if edited
  onPaymentSuccess: (paymentRef: string) => void;
}

// Tiered platform fee calculation
const calculateFee = (amount: number): { fee: number; rate: number; total: number } => {
  let rate = 5; // Default 5%
  if (amount > 800) rate = 2;
  else if (amount > 500) rate = 3;
  
  const fee = amount * (rate / 100);
  return { fee, rate, total: amount + fee };
};

export function PaymentModal({
  isOpen,
  onClose,
  agreedAmount,
  offerId,
  buyerId,
  travelerId,
  itemDescription,
  onAgreedAmountUpdate,
  onPaymentSuccess
}: PaymentModalProps): JSX.Element | null {
  const { user } = useAuthSession();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editedAmount, setEditedAmount] = useState(agreedAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState<"konnect" | "manual">("konnect");
  
  // Manual payment state
  const [manualProvider, setManualProvider] = useState<"d17" | "flouci">("d17");
  const [trxId, setTrxId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate breakdown based on current amount
  const currentAmount = isEditingAmount ? parseFloat(editedAmount) || 0 : agreedAmount;
  const { fee, rate, total } = useMemo(() => calculateFee(currentAmount), [currentAmount]);

  // Create Konnect payment when modal opens
  const createPayment = async () => {
    if (!isOpen || paymentUrl || paymentMethod === "manual") return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total, // Total including platform fee
          agreedAmount: currentAmount, // What traveler gets
          platformFee: fee,
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

  // Auto-create payment when modal opens (if Konnect)
  if (isOpen && !paymentUrl && !isLoading && !error && paymentMethod === "konnect") {
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

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualSubmit = async () => {
    if (!screenshot || !trxId.trim() || !user || !supabase) {
      setError("Please upload a screenshot and enter Transaction ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Upload screenshot to dedicated payment-proofs bucket
      const fileName = `${user.id}/payment-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(uploadData.path);

      // 2. Insert payment proof
      const { error: proofError } = await supabase
        .from("payment_proofs")
        .insert({
          offer_id: offerId,
          buyer_id: user.id,
          provider: manualProvider,
          image_url: publicUrl,
          amount_tnd: total,
          transaction_id: trxId.trim(),
          verified: false
        });

      if (proofError) throw proofError;

      // 3. Update post_offer status
      const { error: offerError } = await supabase
        .from("post_offers")
        .update({
          payment_method: "manual",
          payment_status: "awaiting_verification",
          amount_tnd: currentAmount, // The agreed amount for traveler
          platform_fee_tnd: fee,     // The platform fee
          total_paid_tnd: total,     // The total buyer paid
          updated_at: new Date().toISOString()
        })
        .eq("id", offerId);

      if (offerError) throw offerError;

      // 4. Notify admin (we'll assume admin gets notified via a system notification or we'll just show it in dash)
      // For now, let's just use the success state
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess(`manual-${trxId.trim()}`);
        onClose();
      }, 3000);

    } catch (err) {
      console.error("Manual payment failed:", err);
      setError(err instanceof Error ? err.message : "Failed to submit manual payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentUrl(null);
    setPaymentRef(null);
    setSuccess(false);
    setError(null);
    setIsMockMode(false);
    setIsEditingAmount(false);
    setPaymentMethod("konnect");
    setScreenshot(null);
    setScreenshotPreview(null);
    setTrxId("");
    onClose();
  };
  
  const handleSaveAmount = () => {
    const newAmount = parseFloat(editedAmount);
    if (newAmount > 0 && onAgreedAmountUpdate) {
      onAgreedAmountUpdate(editedAmount);
    }
    setIsEditingAmount(false);
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
                <h2 className="text-lg font-semibold">Payment</h2>
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
                  <h3 className="text-xl font-semibold mb-2">
                    {paymentMethod === "manual" ? "Proof Submitted!" : "Payment Confirmed!"}
                  </h3>
                  <p className="text-muted">
                    {paymentMethod === "manual" 
                      ? "Admin will verify your payment shortly. Once verified, the traveler will be notified."
                      : "Your payment is secured. The traveler will be notified to proceed with delivery."}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Payment Method Selector */}
                  <div className="flex p-1 bg-white/5 rounded-xl">
                    <button
                      onClick={() => setPaymentMethod("konnect")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                        paymentMethod === "konnect" ? "bg-electricBlue text-white shadow-lg" : "text-muted hover:bg-white/5"
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      Konnect
                    </button>
                    <button
                      onClick={() => setPaymentMethod("manual")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                        paymentMethod === "manual" ? "bg-electricBlue text-white shadow-lg" : "text-muted hover:bg-white/5"
                      }`}
                    >
                      <Landmark className="h-4 w-4" />
                      Manual (D17/Flouci)
                    </button>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">You agreed on</span>
                      <div className="flex items-center gap-2">
                        {isEditingAmount ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editedAmount}
                              onChange={(e) => setEditedAmount(e.target.value)}
                              className="w-20 px-2 py-1 rounded bg-white/10 text-right text-sm outline-none focus:ring-1 focus:ring-electricBlue/50"
                              autoFocus
                            />
                            <button onClick={handleSaveAmount} className="p-1 rounded hover:bg-white/10">
                              <Check className="h-4 w-4 text-emerald" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{currentAmount.toFixed(2)} TND</span>
                            <button 
                              onClick={() => setIsEditingAmount(true)}
                              className="p-1 rounded hover:bg-white/10"
                            >
                              <Edit2 className="h-3 w-3 text-muted" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Platform fee ({rate}%)</span>
                      <span className="text-amber">+{fee.toFixed(2)} TND</span>
                    </div>
                    
                    <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                      <span className="font-semibold">Total to pay</span>
                      <span className="font-bold text-xl text-electricBlue">{total.toFixed(2)} TND</span>
                    </div>
                  </div>

                  {paymentMethod === "konnect" ? (
                    // Konnect Flow
                    <div className="space-y-4">
                      {isLoading && !paymentUrl ? (
                        <div className="text-center py-4">
                          <Loader2 className="h-8 w-8 animate-spin text-electricBlue mx-auto" />
                          <p className="text-sm text-muted mt-2">Initializing Konnect...</p>
                        </div>
                      ) : error ? (
                        <div className="bg-rose-400/10 border border-rose-400/20 rounded-lg p-3 text-center">
                          <p className="text-sm text-rose-300 mb-2">{error}</p>
                          <Button onClick={createPayment} size="sm" variant="secondary">Try Again</Button>
                        </div>
                      ) : paymentUrl ? (
                        <div className="space-y-4">
                          {isMockMode && (
                            <div className="bg-amber/10 border border-amber/20 rounded-lg p-3 flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-amber shrink-0 mt-0.5" />
                              <div className="text-xs text-amber/90">
                                <p className="font-semibold">SANDBOX MODE</p>
                                <p>Using mock payment for testing. Simulate on the test page.</p>
                              </div>
                            </div>
                          )}
                          
                          <Button
                            onClick={handleOpenPayment}
                            className="w-full bg-electricBlue gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open Konnect Payment
                          </Button>
                          
                          <p className="text-xs text-muted text-center">
                            After completing payment on Konnect, click below:
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
                      ) : null}
                    </div>
                  ) : (
                    // Manual Flow
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setManualProvider("d17")}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                            manualProvider === "d17" ? "bg-amber/10 border-amber/50" : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <Smartphone className={`h-5 w-5 ${manualProvider === "d17" ? "text-amber" : "text-muted"}`} />
                          <span className="text-xs font-medium">D17</span>
                          <span className="text-[10px] text-muted">22 333 444</span>
                        </button>
                        <button
                          onClick={() => setManualProvider("flouci")}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                            manualProvider === "flouci" ? "bg-electricBlue/10 border-electricBlue/50" : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <Smartphone className={`h-5 w-5 ${manualProvider === "flouci" ? "text-electricBlue" : "text-muted"}`} />
                          <span className="text-xs font-medium">Flouci</span>
                          <span className="text-[10px] text-muted">ghorba-express</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="relative aspect-video rounded-xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                        >
                          {screenshotPreview ? (
                            <img src={screenshotPreview} alt="Proof" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <ImagePlus className="h-8 w-8 text-muted mb-2" />
                              <span className="text-xs text-muted">Upload Transaction Screenshot</span>
                            </>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleScreenshotChange}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>

                        <input
                          type="text"
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                          placeholder="Enter Transaction ID"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-electricBlue/50"
                        />
                      </div>

                      {error && (
                        <p className="text-xs text-rose-300 text-center">{error}</p>
                      )}

                      <Button
                        onClick={handleManualSubmit}
                        disabled={isLoading || !screenshot || !trxId}
                        className="w-full bg-emerald hover:bg-emerald/80 gap-2"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Submit Proof for Verification
                      </Button>
                    </div>
                  )}

                  {/* Escrow Info */}
                  <div className="flex items-center gap-2 text-xs text-emerald bg-emerald/10 rounded-lg p-3">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Your money is held securely in escrow until you confirm the delivery.</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
