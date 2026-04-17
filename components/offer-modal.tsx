"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, ShoppingBag, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"offer" | "success">("offer");

  if (!post) return <></>;

  const isRequest = post.type === "request";

  const handleSubmit = async () => {
    if (!user || !post || !supabase) return;

    setLoading(true);
    try {
      // Determine buyer and traveler
      const buyerId = isRequest ? post.author_id : user.id;
      const travelerId = isRequest ? user.id : post.author_id;

      // Create offer (just to track the connection)
      const { data: offer, error: offerError } = await supabase
        .from("post_offers")
        .insert({
          post_id: post.id,
          offerer_id: user.id,
          buyer_id: buyerId,
          traveler_id: travelerId,
          message: message.trim(),
          status: "pending",
          payment_status: "awaiting_acceptance"
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
      }, 2000);
    } catch (err) {
      console.error("Failed to create offer:", err);
    } finally {
      setLoading(false);
    }
  };

  const author = post.author as { full_name: string } | undefined;

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
                          To <Link href={`/profile/${post.author_id}`} className="text-electricBlue hover:underline">{author?.full_name || "Unknown"}</Link>
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
                    {/* Message */}
                    <div>
                      <label className="text-sm text-muted mb-1.5 block">
                        <MessageCircle className="h-4 w-4 inline mr-1" />
                        Send a message
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={isRequest 
                          ? "Hi! I can bring this for you. I'm traveling on [date]. Let's discuss the details!"
                          : "Hi! I'd like you to bring this item for me. What's your price?"
                        }
                        className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm min-h-[100px] resize-none outline-none focus:ring-1 focus:ring-electricBlue/50"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-3 rounded-xl bg-emerald/10 border border-emerald/30 text-xs">
                      <p className="text-emerald flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          Start a conversation to negotiate the price. Once you agree, 
                          the buyer will enter the amount and pay with the platform fee added.
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
