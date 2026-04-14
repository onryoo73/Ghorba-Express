"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Package, 
  Plane, 
  CheckCircle2,
  Clock,
  ArrowLeft,
  MoreVertical,
  ShieldCheck,
  DollarSign,
  CreditCard,
  QrCode,
  Scan
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/lib/use-auth-session";
import { supabase } from "@/lib/supabase/client";
import type { Post } from "@/lib/supabase/database.types";
import { PaymentModal } from "@/components/payment-modal";
import { DeliveryConfirmation } from "@/components/delivery-confirmation";

interface ChatThread {
  id: string;
  post_id: string;
  buyer_id: string;
  traveler_id: string;
  offer_id?: string;
  status: "active" | "completed" | "disputed";
  created_at: string;
  post?: Post;
  other_user?: { full_name: string; id: string };
  last_message?: { message: string; created_at: string; sender_id: string };
  unread_count?: number;
  // Payment fields
  payment_intent_id?: string;
  payment_status?: "pending" | "authorized" | "captured" | "failed" | "refunded";
  amount_tnd?: number;
  delivery_status?: "pending" | "in_transit" | "delivered" | "confirmed";
}

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: { full_name: string };
}

export default function MessagesPage(): JSX.Element {
  const { user, isAuthenticated } = useAuthSession();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Payment & Delivery modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"generate" | "scan">("generate");

  // Fetch threads
  useEffect(() => {
    if (!user) return;

    const fetchThreads = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from("chat_threads")
        .select(`
          *,
          post:posts(*, author:profiles(full_name)),
          buyer:profiles!buyer_id(full_name, id),
          traveler:profiles!traveler_id(full_name, id),
          offer:post_offers(*)
        `)
        .or(`buyer_id.eq.${user.id},traveler_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (data) {
        const formatted = data.map((t: any) => ({
          ...t,
          other_user: t.buyer_id === user.id ? t.traveler : t.buyer,
          last_message: { message: "No messages yet", created_at: t.created_at },
          // Map offer payment data
          offer_id: t.offer?.id,
          payment_intent_id: t.offer?.payment_intent_id,
          payment_status: t.offer?.payment_status,
          amount_tnd: t.offer?.amount_tnd,
          delivery_status: t.delivery_status
        }));
        setThreads(formatted);
      }
      setLoading(false);
    };

    fetchThreads();
  }, [user]);

  // Fetch messages when thread selected
  useEffect(() => {
    if (!selectedThread) return;

    const fetchMessages = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from("chat_messages")
        .select("*, sender:profiles(full_name)")
        .eq("thread_id", selectedThread.id)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscribe to new messages
    if (!supabase) return;
    const subscription = supabase
      .channel(`chat_${selectedThread.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `thread_id=eq.${selectedThread.id}`
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedThread]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !user || !supabase) return;

    await supabase.from("chat_messages").insert({
      thread_id: selectedThread.id,
      sender_id: user.id,
      message: newMessage.trim()
    });

    setNewMessage("");
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted" />
          <h2 className="text-xl font-semibold mb-2">Sign in to view messages</h2>
          <p className="text-muted">Connect with buyers and travelers</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
        <div className="flex h-full gap-4">
          {/* Threads List */}
          <div className={`w-full lg:w-80 flex-shrink-0 ${showMobileChat ? "hidden lg:block" : ""}`}>
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                  {threads.length > 0 && (
                    <span className="ml-auto bg-white/10 px-2 py-0.5 rounded-full text-xs">{threads.length}</span>
                  )}
                </h1>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-muted">Loading...</div>
                ) : threads.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-3 text-muted" />
                    <p className="text-muted">No messages yet</p>
                    <p className="text-sm text-muted mt-1">Make an offer to start chatting!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {threads.map((thread) => {
                      const isBuyer = thread.buyer_id === user?.id;
                      const post = thread.post as Post;
                      
                      return (
                        <button
                          key={thread.id}
                          onClick={() => {
                            setSelectedThread(thread);
                            setShowMobileChat(true);
                          }}
                          className={`w-full p-4 text-left transition-colors hover:bg-white/5 ${
                            selectedThread?.id === thread.id ? "bg-white/10" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isBuyer ? "bg-rose-400/20" : "bg-emerald/20"
                            }`}>
                              {isBuyer ? (
                                <Plane className="h-5 w-5 text-rose-300" />
                              ) : (
                                <Package className="h-5 w-5 text-emerald" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {thread.other_user?.full_name || "Unknown"}
                                </span>
                                <span className="text-[10px] border border-white/20 px-1.5 py-0.5 rounded shrink-0">
                                  {isBuyer ? "Traveler" : "Buyer"}
                                </span>
                              </div>
                              <p className="text-sm text-muted truncate">
                                {post?.content?.slice(0, 30)}...
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                                <Clock className="h-3 w-3" />
                                {formatTime(thread.created_at)}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 ${!showMobileChat ? "hidden lg:block" : ""}`}>
            <Card className="h-full flex flex-col">
              {selectedThread ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="lg:hidden p-2 -ml-2 hover:bg-white/10 rounded-lg"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedThread.buyer_id === user?.id ? "bg-rose-400/20" : "bg-emerald/20"
                    }`}>
                      {selectedThread.buyer_id === user?.id ? (
                        <Plane className="h-5 w-5 text-rose-300" />
                      ) : (
                        <Package className="h-5 w-5 text-emerald" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{selectedThread.other_user?.full_name}</p>
                      <p className="text-xs text-muted">
                        {selectedThread.status === "active" ? "Active conversation" : "Completed"}
                      </p>
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-electricBlue" />
                        <p className="text-muted">Start the conversation!</p>
                        <p className="text-sm text-muted">Discuss details before confirming the deal</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.sender_id === user?.id;
                        const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                              {showAvatar && !isMe && (
                                <p className="text-xs text-muted mb-1 ml-1">
                                  {msg.sender?.full_name}
                                </p>
                              )}
                              <div
                                className={`px-4 py-2 rounded-2xl ${
                                  isMe
                                    ? "bg-electricBlue text-white rounded-br-md"
                                    : "bg-white/10 rounded-bl-md"
                                }`}
                              >
                                <p>{msg.message}</p>
                              </div>
                              <p className="text-xs text-muted mt-1 px-1">
                                {formatTime(msg.created_at)}
                                {isMe && (
                                  <CheckCircle2 className="h-3 w-3 inline ml-1" />
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Payment & Delivery Actions */}
                  <div className="px-4 py-3 bg-white/5 border-y border-white/10">
                    {selectedThread.payment_status === "pending" && selectedThread.buyer_id === user?.id && (
                      // Buyer needs to pay
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-amber" />
                          <span className="text-sm text-amber">Payment required to proceed</span>
                        </div>
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-electricBlue rounded-lg text-sm font-medium hover:bg-electricBlue/80 transition-colors"
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay {selectedThread.amount_tnd || 0} TND
                        </button>
                      </div>
                    )}
                    
                    {selectedThread.payment_status === "pending" && selectedThread.traveler_id === user?.id && (
                      // Traveler waiting for payment
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber" />
                        <span className="text-sm text-amber">Waiting for buyer to complete payment...</span>
                      </div>
                    )}
                    
                    {selectedThread.payment_status === "authorized" && (
                      // Payment secured - show delivery options
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald" />
                          <span className="text-sm text-emerald">
                            {selectedThread.delivery_status === "confirmed" 
                              ? "Delivery confirmed & paid" 
                              : "Payment secured in escrow"}
                          </span>
                        </div>
                        {selectedThread.delivery_status !== "confirmed" && (
                          <>
                            {selectedThread.buyer_id === user?.id ? (
                              // Buyer shows QR for delivery
                              <button
                                onClick={() => {
                                  setDeliveryMode("generate");
                                  setShowDeliveryModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald rounded-lg text-sm font-medium hover:bg-emerald/80 transition-colors"
                              >
                                <QrCode className="h-4 w-4" />
                                Confirm Receipt
                              </button>
                            ) : (
                              // Traveler scans QR to complete
                              <button
                                onClick={() => {
                                  setDeliveryMode("scan");
                                  setShowDeliveryModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald rounded-lg text-sm font-medium hover:bg-emerald/80 transition-colors"
                              >
                                <Scan className="h-4 w-4" />
                                Complete Delivery
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    
                    {selectedThread.payment_status === "captured" && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald" />
                        <span className="text-sm text-emerald">Transaction complete - payment released</span>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1"
                      />
                      <button 
                        onClick={sendMessage}
                        className="p-3 bg-electricBlue rounded-xl hover:bg-electricBlue/80 transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted mt-2 text-center">
                      QR code scan required to release funds after delivery
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted" />
                    <p className="text-muted">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {selectedThread && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={selectedThread.amount_tnd || 50}
          currency="usd"
          offerId={selectedThread.offer_id || ""}
          buyerId={selectedThread.buyer_id}
          travelerId={selectedThread.traveler_id}
          itemDescription={selectedThread.post?.content?.slice(0, 50) || "Delivery service"}
          onPaymentSuccess={async (paymentIntentId) => {
            // Update database with payment
            if (supabase && selectedThread.offer_id) {
              await supabase
                .from("post_offers")
                .update({ 
                  payment_intent_id: paymentIntentId,
                  payment_status: "authorized",
                  status: "accepted"
                })
                .eq("id", selectedThread.offer_id);
              
              // Refresh threads
              setThreads(prev => prev.map(t => 
                t.id === selectedThread.id 
                  ? { ...t, payment_status: "authorized", payment_intent_id: paymentIntentId }
                  : t
              ));
            }
            setShowPaymentModal(false);
          }}
        />
      )}
      
      {/* Delivery Confirmation Modal */}
      {selectedThread && (
        <DeliveryConfirmation
          isOpen={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          offerId={selectedThread.offer_id || ""}
          paymentIntentId={selectedThread.payment_intent_id || ""}
          buyerId={selectedThread.buyer_id}
          travelerId={selectedThread.traveler_id}
          itemDescription={selectedThread.post?.content?.slice(0, 50) || "Delivery"}
          mode={deliveryMode}
          onConfirmed={() => {
            // Update local state
            setThreads(prev => prev.map(t => 
              t.id === selectedThread.id 
                ? { ...t, payment_status: "captured", delivery_status: "confirmed" }
                : t
            ));
            setSelectedThread(prev => prev ? {
              ...prev, 
              payment_status: "captured", 
              delivery_status: "confirmed" 
            } : null);
          }}
        />
      )}
    </AppShell>
  );
}
