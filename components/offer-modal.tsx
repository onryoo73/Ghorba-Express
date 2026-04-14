"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, DollarSign, Package, Plane, ShoppingBag, ShieldCheck, Lock, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Post } from "@/lib/supabase/database.types";
import { useAuthSession } from "@/lib/use-auth-session";
import { supabase } from "@/lib/supabase/client";

interface OfferModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OfferModal({ post, isOpen, onClose, onSuccess }: OfferModalProps): JSX.Element {
  const { user } = useAuthSession();
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"offer" | "success">("offer");

  if (!post) return <></>;

  const isRequest = post.type === "request";
  const defaultPrice = isRequest 
    ? (post.reward_tnd || post.product_price_tnd || "")
    : (post.price_per_kg_tnd || "");

  const handleSubmit = async () => {
    if (!user || !post || !supabase) return;

    setLoading(true);
    try {
      // Calculate amounts
      const PLATFORM_FEE_PERCENT = 5;
      const proposedPrice = price ? parseFloat(price) : 0;
      const itemPrice = post.product_price_tnd || 0;
      const platformFee = proposedPrice * (PLATFORM_FEE_PERCENT / 100);
      const totalAmount = isRequest 
        ? itemPrice + proposedPrice + platformFee  // Buyer pays item + reward + fee
        : proposedPrice + platformFee;  // Buyer pays delivery fee + platform fee

      // Determine buyer and traveler
      const buyerId = isRequest ? post.author_id : user.id;
      const travelerId = isRequest ? user.id : post.author_id;

      // Create offer with payment info
      const { data: offer, error: offerError } = await supabase
        .from("post_offers")
        .insert({
          post_id: post.id,
          offerer_id: user.id,
          buyer_id: buyerId,
          traveler_id: travelerId,
          message: message.trim(),
          proposed_price_tnd: proposedPrice,
          amount_tnd: totalAmount,
          platform_fee_tnd: platformFee,
          total_paid_tnd: totalAmount,
          status: "pending",
          payment_status: "pending"
        })
        .select()
        .single();

      if (offerError) throw offerError;

      // Create notification for post author
      await supabase.from("notifications").insert({
        recipient_id: post.author_id,
        sender_id: user.id,
        type: "offer",
        post_id: post.id,
        offer_id: offer?.id,
        title: isRequest ? "New offer on your request" : "New delivery request",
        message: message.trim() || (isRequest ? "Someone wants to fulfill your request" : "Someone wants you to deliver")
      });

      // Create chat thread with offer reference
      const { data: thread } = await supabase
        .from("chat_threads")
        .insert({
          post_id: post.id,
          buyer_id: buyerId,
          traveler_id: travelerId,
          offer_id: offer?.id
        })
        .select()
        .single();

      // Send initial message
      if (thread) {
        await supabase.from("chat_messages").insert({
          thread_id: thread.id,
          sender_id: user.id,
          message: message.trim() || "Hi! I'm interested in this. Let's discuss details."
        });
      }

      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep("offer");
        setMessage("");
        setPrice("");
      }, 2000);
    } catch (err) {
      console.error("Failed to create offer:", err);
    } finally {
      setLoading(false);
    }
  };

  const author = post.author as { full_name: string } | undefined;
  
  // Escrow calculations
  const PLATFORM_FEE_PERCENT = 5; // 5% platform fee
  const itemPrice = post.product_price_tnd || 0;
  const proposedReward = price ? parseFloat(price) : (post.reward_tnd || 0);
  
  // For requests: Traveler sees what they'll earn
  const travelerReimbursement = isRequest ? itemPrice : 0;
  const travelerReward = isRequest ? proposedReward : (post.price_per_kg_tnd || 0) * (post.weight_available_kg || 1);
  const travelerTotalEarnings = travelerReimbursement + travelerReward;
  const platformFee = travelerReward * (PLATFORM_FEE_PERCENT / 100);
  const travelerNetEarnings = travelerTotalEarnings - platformFee;
  
  // For requests: Buyer pays
  const buyerTotal = isRequest ? itemPrice + proposedReward + (proposedReward * 0.05) : travelerReward + (travelerReward * 0.05);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal Container - full screen flex center */}
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg my-auto"
            >
              <Card className="overflow-hidden">
              {step === "offer" ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isRequest ? "bg-rose-400/20" : "bg-emerald/20"}`}>
                        {isRequest ? (
                          <ShoppingBag className="h-5 w-5 text-rose-300" />
                        ) : (
                          <Plane className="h-5 w-5 text-emerald" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {isRequest ? "Make an Offer" : "Request Delivery"}
                        </h3>
                        <p className="text-xs text-muted">
                          To {author?.full_name || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Post Preview */}
                  <div className="p-4 bg-white/5">
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex gap-2 mt-2 text-xs text-muted">
                      {post.origin && <span>{post.origin}</span>}
                      {post.origin && post.destination && <span>→</span>}
                      {post.destination && <span>{post.destination}</span>}
                    </div>
                  </div>

                  {/* Form */}
                  <div className="p-4 space-y-4">
                    {/* Price input */}
                    <div>
                      <label className="text-sm text-muted mb-1.5 block">
                        {isRequest ? "Your proposed reward (TND)" : "Your price per kg (TND)"}
                      </label>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                        <DollarSign className="h-4 w-4 text-emerald" />
                        <Input
                          type="number"
                          placeholder={defaultPrice?.toString() || "0"}
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                        />
                        <span className="text-sm text-muted">TND</span>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-sm text-muted mb-1.5 block">
                        <MessageCircle className="h-4 w-4 inline mr-1" />
                        Message (optional)
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={isRequest 
                          ? "Hi! I can bring this for you. I'm traveling on..."
                          : "Hi! I'd like you to bring this item for me..."
                        }
                        className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm min-h-[80px] resize-none outline-none focus:ring-1 focus:ring-electricBlue/50"
                      />
                    </div>

                    {/* ESCROW BREAKDOWN */}
                    <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/30">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="h-5 w-5 text-emerald" />
                        <h4 className="font-semibold text-emerald">Escrow Protection</h4>
                      </div>
                      
                      {isRequest ? (
                        // TRAVELER VIEW (making offer on request)
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted">Item cost (reimbursed)</span>
                            <span className="font-medium">{itemPrice > 0 ? `${itemPrice} TND` : "After confirmation"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Your reward</span>
                            <span className="font-medium text-emerald">+{proposedReward} TND</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                            <span className="text-rose-300">-{platformFee.toFixed(2)} TND</span>
                          </div>
                          <div className="border-t border-white/10 pt-2 flex justify-between">
                            <span className="font-semibold">You receive</span>
                            <span className="font-bold text-emerald text-lg">{travelerNetEarnings.toFixed(2)} TND</span>
                          </div>
                          <p className="text-xs text-muted mt-2">
                            <Lock className="h-3 w-3 inline mr-1" />
                            Buyer pays upfront. Funds held securely until QR delivery scan.
                          </p>
                        </div>
                      ) : (
                        // BUYER VIEW (requesting delivery on trip)
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted">Delivery fee</span>
                            <span className="font-medium">{travelerReward.toFixed(2)} TND</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                            <span className="text-rose-300">+{platformFee.toFixed(2)} TND</span>
                          </div>
                          <div className="border-t border-white/10 pt-2 flex justify-between">
                            <span className="font-semibold">You pay</span>
                            <span className="font-bold text-rose-300 text-lg">{(travelerReward + platformFee).toFixed(2)} TND</span>
                          </div>
                          <p className="text-xs text-muted mt-2">
                            <Lock className="h-3 w-3 inline mr-1" />
                            Funds held in escrow. Released to traveler after QR delivery confirmation.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Info box */}
                    <div className="p-3 rounded-xl bg-electricBlue/10 border border-electricBlue/20 text-xs">
                      <p className="text-electricBlue flex items-start gap-2">
                        <QrCode className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          After delivery, the buyer scans your QR code to confirm. 
                          Funds are released instantly. No cash handling needed!
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-white/10 flex gap-2">
                    <Button variant="secondary" onClick={onClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="flex-1 gap-2"
                    >
                      {loading ? (
                        <span className="animate-pulse">Sending...</span>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          {isRequest ? "Send Offer" : "Request"}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                /* Success State */
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-emerald" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Sent!</h3>
                  <p className="text-sm text-muted">
                    {isRequest 
                      ? "Your offer has been sent. You'll be notified when they respond."
                      : "Your request has been sent. You'll be notified when they respond."
                    }
                  </p>
                </div>
              )}
            </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
