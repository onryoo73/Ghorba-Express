"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Package, 
  Plane, 
  CheckCircle2,
  Clock,
  Star,
  ArrowLeft,
  MoreVertical,
  ShieldCheck,
  DollarSign,
  CreditCard,
  QrCode,
  Scan,
  XCircle,
  MessageCircle
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/lib/use-auth-session";
import { supabase } from "@/lib/supabase/client";
import type { Post } from "@/lib/supabase/database.types";
import { PaymentModal } from "@/components/payment-modal";
import { DeliveryOTP } from "@/components/delivery-otp";
import { ReviewModal } from "@/components/review-modal";
import type { PostOffer } from "@/lib/supabase/database.types";

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
  // Review status
  has_reviewed?: boolean;
  // Payment fields
  payment_intent_id?: string;
  payment_method?: "konnect" | "manual" | null;
  payment_status?: "awaiting_acceptance" | "pending" | "awaiting_payment" | "awaiting_verification" | "authorized" | "captured" | "failed" | "refunded";
  amount_tnd?: number; // Total buyer pays
  item_price_tnd?: number; // Item cost
  proposed_price_tnd?: number; // Traveler reward
  platform_fee_tnd?: number; // Platform fee
  platform_fee_rate?: number; // Fee percentage
  total_paid_tnd?: number; // Total paid
  delivery_status?: "pending" | "in_transit" | "delivered" | "buyer_confirmed" | "completed";
  offer_status?: "pending" | "accepted" | "declined" | "cancelled";
  // OTP fields
  delivery_otp?: string | null;
  traveler_confirmed_delivery?: boolean | null;
  buyer_confirmed_receipt?: boolean | null;
  otp_verified?: boolean | null;
  payment_released?: boolean | null;
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

// Tiered platform fee calculation helper
const calculateTieredFee = (amount: number): { fee: number; rate: number; total: number } => {
  let rate = 5; // 0-500 TND: 5%
  if (amount > 800) rate = 2; // 800+ TND: 2%
  else if (amount > 500) rate = 3; // 500-800 TND: 3%
  
  const fee = amount * (rate / 100);
  return { fee, rate, total: amount + fee };
};

export const dynamic = "force-dynamic";

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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"buyer" | "traveler">("buyer");
  
  // Agreed amount input (buyer enters what they agreed on)
  const [agreedAmount, setAgreedAmount] = useState<string>("");

  const fetchThreads = async () => {
    if (!supabase || !user) return;
    const { data } = await supabase
      .from("chat_threads")
      .select(`
        *,
        post:posts(*, author:profiles(full_name)),
        buyer:profiles!buyer_id(full_name, id),
        traveler:profiles!traveler_id(full_name, id),
        offer:post_offers(*, reviews(reviewer_id)),
        messages:chat_messages(message, created_at, sender_id)
      `)
      .or(`buyer_id.eq.${user.id},traveler_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })
      .limit(1, { foreignTable: 'chat_messages' })
      .order('created_at', { foreignTable: 'chat_messages', ascending: false });

    if (data) {
      const formatted = data.map((t: any) => {
        const lastMsg = t.messages?.[0];
        const hasReviewed = t.offer?.reviews?.some((r: any) => r.reviewer_id === user.id);
        return {
          ...t,
          other_user: t.buyer_id === user.id ? t.traveler : t.buyer,
          has_reviewed: hasReviewed,
          last_message: lastMsg ? { 
            message: lastMsg.message, 
            created_at: lastMsg.created_at,
            sender_id: lastMsg.sender_id
          } : { message: "No messages yet", created_at: t.created_at },
          // Map offer payment data with new breakdown fields
          offer_id: t.offer?.id,
          payment_intent_id: t.offer?.payment_intent_id,
          payment_status: t.offer?.payment_status,
          amount_tnd: t.offer?.total_paid_tnd || t.offer?.amount_tnd,
          item_price_tnd: t.offer?.item_price_tnd || t.post?.product_price_tnd,
          proposed_price_tnd: t.offer?.proposed_price_tnd,
          platform_fee_tnd: t.offer?.platform_fee_tnd,
          platform_fee_rate: t.offer?.platform_fee_rate || 5,
          total_paid_tnd: t.offer?.total_paid_tnd,
          delivery_status: t.delivery_status,
          offer_status: t.offer?.status,
          // OTP fields
          delivery_otp: t.offer?.delivery_otp,
          traveler_confirmed_delivery: t.offer?.traveler_confirmed_delivery,
          buyer_confirmed_receipt: t.offer?.buyer_confirmed_receipt,
          otp_verified: t.offer?.otp_verified,
          payment_released: t.offer?.payment_released
        };
      });
      setThreads(formatted);
      
      // Update selected thread if it exists to reflect real-time changes
      setSelectedThread(prev => {
        if (!prev) return null;
        const updated = formatted.find(t => t.id === prev.id);
        return updated || prev;
      });
    }
    setLoading(false);
  };

  // Fetch threads initially and on user change
  useEffect(() => {
    if (!user) return;
    fetchThreads();
    
    // Subscribe to thread updates and new threads
    if (!supabase || !user) return;
    
    const userChannel = supabase
      .channel(`user_${user.id}_updates`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_threads'
      }, (payload) => {
        console.log('[Realtime] Thread change detected:', payload.eventType);
        fetchThreads();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'post_offers'
      }, (payload) => {
        console.log('[Realtime] Offer update detected:', payload.new.id);
        const newOffer = payload.new;
        
        // Optimistic update for the threads list to make it "instant"
        setThreads(prev => prev.map(t => {
          if (t.offer_id === newOffer.id) {
            return {
              ...t,
              payment_status: newOffer.payment_status,
              delivery_status: newOffer.delivery_status,
              delivery_otp: newOffer.delivery_otp,
              traveler_confirmed_delivery: newOffer.traveler_confirmed_delivery,
              buyer_confirmed_receipt: newOffer.buyer_confirmed_receipt,
              otp_verified: newOffer.otp_verified,
              payment_released: newOffer.payment_released
            };
          }
          return t;
        }));

        // Also update selected thread immediately
        setSelectedThread(prev => {
          if (prev && prev.offer_id === newOffer.id) {
            return {
              ...prev,
              payment_status: newOffer.payment_status,
              delivery_status: newOffer.delivery_status,
              delivery_otp: newOffer.delivery_otp,
              traveler_confirmed_delivery: newOffer.traveler_confirmed_delivery,
              buyer_confirmed_receipt: newOffer.buyer_confirmed_receipt,
              otp_verified: newOffer.otp_verified,
              payment_released: newOffer.payment_released
            };
          }
          return prev;
        });

        // Still refetch to ensure all joined data (like post info) is correct
        fetchThreads();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'post_offers'
      }, () => fetchThreads())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reviews'
      }, () => {
        console.log('[Realtime] New review detected');
        fetchThreads();
      })
      .subscribe((status) => {
        console.log('[Realtime] Global subscription status:', status);
      });

    // Handle window focus - force refetch to ensure we're up to date
    // This solves the "switch apps" issue where background tabs might miss updates
    const handleFocus = () => {
      console.log('[App] Window focused, refreshing data...');
      fetchThreads();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      userChannel.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
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
    if (!supabase || !user) return;
    
    const msgChannel = supabase
      .channel(`chat_${selectedThread.id}_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `thread_id=eq.${selectedThread.id}`
      }, (payload) => {
        console.log('[Realtime] New message received');
        // Only add if not already in list (avoid duplicates from optimistic update)
        setMessages((prev) => {
          const exists = prev.some(m => m.id === payload.new.id);
          if (exists) return prev;
          
          const newMsg = payload.new as ChatMessage;
          // Enrich with sender name if missing from payload
          if (!newMsg.sender) {
            const isMe = newMsg.sender_id === user.id;
            newMsg.sender = { 
              full_name: isMe 
                ? (user.user_metadata?.full_name || 'You') 
                : (selectedThread.other_user?.full_name || 'User')
            };
          }
          return [...prev, newMsg];
        });
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "chat_messages",
        filter: `thread_id=eq.${selectedThread.id}`
      }, (payload) => {
        setMessages((prev) => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "chat_messages",
        filter: `thread_id=eq.${selectedThread.id}`
      }, (payload) => {
        setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      msgChannel.unsubscribe();
    };
  }, [selectedThread]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !user || !supabase) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update - add message immediately
    const optimisticMessage: ChatMessage = {
      id: tempId,
      thread_id: selectedThread.id,
      sender_id: user.id,
      message: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: { full_name: user.user_metadata?.full_name || 'You' }
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    // Send to server
    const { data, error } = await supabase.from("chat_messages").insert({
      thread_id: selectedThread.id,
      sender_id: user.id,
      message: messageText
    }).select('*, sender:profiles(full_name)').single();
    
    if (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error('Failed to send message:', error);
    } else if (data) {
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? (data as ChatMessage) : m));
    }
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
              <div className="p-4 border-b border-divider">
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                  {threads.length > 0 && (
                    <span className="ml-auto bg-surface px-2 py-0.5 rounded-full text-xs">{threads.length}</span>
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
                  <div className="divide-y divide-divider">
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
                          className={`w-full p-4 text-left transition-colors hover:bg-surface ${
                            selectedThread?.id === thread.id ? "bg-surface-hover" : ""
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
                                <Link href={`/profile/${thread.other_user?.id}`} className="font-medium truncate hover:text-electricBlue transition-colors">
                                  {thread.other_user?.full_name || "Unknown"}
                                </Link>
                                <span className="text-[10px] border border-border px-1.5 py-0.5 rounded shrink-0">
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
                  <div className="p-4 border-b border-divider flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="lg:hidden p-2 -ml-2 hover:bg-surface rounded-lg"
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
                      <Link href={`/profile/${selectedThread.other_user?.id}`} className="font-medium hover:text-electricBlue transition-colors">{selectedThread.other_user?.full_name}</Link>
                      <p className="text-xs text-muted">
                        {selectedThread.status === "active" ? "Active conversation" : "Completed"}
                      </p>
                    </div>
                    <button className="p-2 hover:bg-surface rounded-lg">
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
                                    : "bg-surface rounded-bl-md"
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
                  <div className="px-4 py-3 bg-surface border-y border-divider">
                    {/* STEP 0: Initial Offer - Post author needs to accept to start chat */}
                    {selectedThread.offer_status === "pending" && (
                      <>
                        {selectedThread.post?.author_id === user?.id || 
                         (selectedThread.post?.type === "trip" && selectedThread.traveler_id === user?.id) ? (
                          // Post author sees Accept/Decline
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber" />
                              <span className="text-sm text-amber">New {selectedThread.post?.type === "request" ? "delivery offer" : "delivery request"}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (supabase && selectedThread.offer_id) {
                                    await supabase
                                      .from("post_offers")
                                      .update({ 
                                        status: "accepted",
                                        payment_status: "awaiting_acceptance"
                                      })
                                      .eq("id", selectedThread.offer_id);
                                    
                                    // Notify the other party
                                    const notifyId = selectedThread.post?.type === "request" 
                                      ? selectedThread.traveler_id 
                                      : selectedThread.buyer_id;
                                    
                                    await supabase.from("notifications").insert({
                                      recipient_id: notifyId,
                                      sender_id: user?.id,
                                      type: "offer",
                                      title: "Offer accepted!",
                                      message: "Let's discuss the details and agree on a price."
                                    });
                                    
                                    setThreads(prev => prev.map(t => 
                                      t.id === selectedThread.id 
                                        ? { ...t, offer_status: "accepted", payment_status: "awaiting_acceptance" }
                                        : t
                                    ));
                                    setSelectedThread(prev => prev ? {
                                      ...prev, 
                                      offer_status: "accepted",
                                      payment_status: "awaiting_acceptance"
                                    } : null);
                                  }
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald rounded-lg text-sm font-medium hover:bg-emerald/80 transition-colors"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Accept & Chat
                              </button>
                              <button
                                onClick={async () => {
                                  if (supabase && selectedThread.offer_id) {
                                    await supabase
                                      .from("post_offers")
                                      .update({ status: "declined" })
                                      .eq("id", selectedThread.offer_id);
                                    
                                    const notifyId = selectedThread.post?.type === "request" 
                                      ? selectedThread.traveler_id 
                                      : selectedThread.buyer_id;
                                    
                                    await supabase.from("notifications").insert({
                                      recipient_id: notifyId,
                                      sender_id: user?.id,
                                      type: "offer",
                                      title: "Offer declined",
                                      message: "Sorry, this won't work for me."
                                    });
                                    
                                    setThreads(prev => prev.map(t => 
                                      t.id === selectedThread.id 
                                        ? { ...t, offer_status: "declined" }
                                        : t
                                    ));
                                    setSelectedThread(prev => prev ? {
                                      ...prev, 
                                      offer_status: "declined"
                                    } : null);
                                  }
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-400/20 text-rose-600 dark:text-rose-300 rounded-lg text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-400/30 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                                Decline
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Waiting for post author to accept
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber" />
                            <span className="text-sm text-amber">Waiting for response...</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* STEP 1: Chatting - Buyer proposes amount */}
                    {selectedThread.offer_status === "accepted" && !selectedThread.proposed_price_tnd && selectedThread.payment_status === "awaiting_acceptance" && (
                      <>
                        {selectedThread.buyer_id === user?.id ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4 text-electricBlue" />
                              <span className="text-sm">Agreed on a price? Enter the amount and send for approval</span>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <input
                                  type="number"
                                  placeholder="Enter agreed amount (TND)"
                                  value={agreedAmount}
                                  onChange={(e) => setAgreedAmount(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-electricBlue/50"
                                />
                              </div>
                              <button
                                onClick={async () => {
                                  if (!agreedAmount || parseFloat(agreedAmount) <= 0 || !supabase || !selectedThread.offer_id) return;
                                  
                                  // Save proposed amount and update status
                                  await supabase
                                    .from("post_offers")
                                    .update({ 
                                      proposed_price_tnd: parseFloat(agreedAmount),
                                      payment_status: "pending" // Now traveler sees it
                                    })
                                    .eq("id", selectedThread.offer_id);
                                  
                                  // Notify traveler
                                  await supabase.from("notifications").insert({
                                    recipient_id: selectedThread.traveler_id,
                                    sender_id: user?.id,
                                    type: "offer",
                                    title: "Price proposed!",
                                    message: `Buyer proposed ${agreedAmount} TND. Accept to proceed with payment.`
                                  });
                                  
                                  // Update local state
                                  setThreads(prev => prev.map(t => 
                                    t.id === selectedThread.id 
                                      ? { ...t, proposed_price_tnd: parseFloat(agreedAmount), payment_status: "pending" }
                                      : t
                                  ));
                                  setSelectedThread(prev => prev ? {
                                    ...prev, 
                                    proposed_price_tnd: parseFloat(agreedAmount),
                                    payment_status: "pending"
                                  } : null);
                                }}
                                disabled={!agreedAmount || parseFloat(agreedAmount) <= 0}
                                className="flex items-center gap-2 px-4 py-2 bg-electricBlue rounded-lg text-sm font-medium hover:bg-electricBlue/80 transition-colors disabled:opacity-50"
                              >
                                <Send className="h-4 w-4" />
                                Send
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber" />
                            <span className="text-sm text-amber">Waiting for buyer to propose a price...</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* STEP 2: Amount Proposed - Traveler accepts/declines */}
                    {selectedThread.offer_status === "accepted" && selectedThread.proposed_price_tnd && selectedThread.payment_status === "pending" && (
                      <>
                        {selectedThread.traveler_id === user?.id ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-emerald" />
                              <span className="text-sm">Buyer proposed: <span className="font-bold text-emerald">{selectedThread.proposed_price_tnd.toFixed(2)} TND</span></span>
                            </div>
                            {(() => {
                              const { fee, rate, total } = calculateTieredFee(selectedThread.proposed_price_tnd || 0);
                              return (
                                <p className="text-xs text-muted">
                                  You'll receive: {selectedThread.proposed_price_tnd?.toFixed(2)} TND after delivery
                                  <br />
                                  Buyer pays: {total.toFixed(2)} TND (includes {rate}% platform fee)
                                </p>
                              );
                            })()}
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (supabase && selectedThread.offer_id) {
                                    await supabase
                                      .from("post_offers")
                                      .update({ 
                                        payment_status: "awaiting_payment" // Now buyer can pay
                                      })
                                      .eq("id", selectedThread.offer_id);
                                    
                                    // Notify buyer
                                    await supabase.from("notifications").insert({
                                      recipient_id: selectedThread.buyer_id,
                                      sender_id: user?.id,
                                      type: "offer",
                                      title: "Price accepted!",
                                      message: `I accepted your offer of ${selectedThread.proposed_price_tnd?.toFixed(2)} TND. You can now complete the payment.`
                                    });
                                    
                                    setThreads(prev => prev.map(t => 
                                      t.id === selectedThread.id 
                                        ? { ...t, payment_status: "awaiting_payment" }
                                        : t
                                    ));
                                    setSelectedThread(prev => prev ? {
                                      ...prev, 
                                      payment_status: "awaiting_payment"
                                    } : null);
                                  }
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald rounded-lg text-sm font-medium hover:bg-emerald/80 transition-colors"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Accept Amount
                              </button>
                              <button
                                onClick={async () => {
                                  if (supabase && selectedThread.offer_id) {
                                    // Reset proposed amount
                                    await supabase
                                      .from("post_offers")
                                      .update({ 
                                        proposed_price_tnd: null,
                                        payment_status: "awaiting_acceptance"
                                      })
                                      .eq("id", selectedThread.offer_id);
                                    
                                    // Notify buyer
                                    await supabase.from("notifications").insert({
                                      recipient_id: selectedThread.buyer_id,
                                      sender_id: user?.id,
                                      type: "offer",
                                      title: "Price declined",
                                      message: "Let's negotiate a different price. Send a new proposal."
                                    });
                                    
                                    setThreads(prev => prev.map(t => 
                                      t.id === selectedThread.id 
                                        ? { ...t, proposed_price_tnd: undefined, payment_status: "awaiting_acceptance" }
                                        : t
                                    ));
                                    setSelectedThread(prev => prev ? {
                                      ...prev, 
                                      proposed_price_tnd: undefined,
                                      payment_status: "awaiting_acceptance"
                                    } : null);
                                  }
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-400/20 text-rose-600 dark:text-rose-300 rounded-lg text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-400/30 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                                Decline
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber" />
                            <span className="text-sm text-amber">Waiting for traveler to accept {selectedThread.proposed_price_tnd?.toFixed(2)} TND...</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* STEP 3: Amount Accepted - Buyer pays */}
                    {selectedThread.offer_status === "accepted" && selectedThread.proposed_price_tnd && selectedThread.payment_status === "awaiting_payment" && (
                      <>
                        {selectedThread.buyer_id === user?.id ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-emerald" />
                              <span className="text-sm text-emerald">Traveler accepted {selectedThread.proposed_price_tnd.toFixed(2)} TND</span>
                            </div>
                            {(() => {
                              const { fee, rate, total } = calculateTieredFee(selectedThread.proposed_price_tnd || 0);
                              return (
                                <div className="bg-surface rounded-lg p-3 space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted">Agreed amount</span>
                                    <span>{selectedThread.proposed_price_tnd?.toFixed(2)} TND</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted">Platform fee ({rate}%)</span>
                                    <span className="text-amber">+{fee.toFixed(2)} TND</span>
                                  </div>
                                  <div className="flex justify-between font-semibold border-t border-divider pt-1">
                                    <span>Total to pay</span>
                                    <span className="text-electricBlue">{total.toFixed(2)} TND</span>
                                  </div>
                                </div>
                              );
                            })()}
                            <button
                              onClick={() => {
                                setAgreedAmount(selectedThread.proposed_price_tnd?.toString() || "");
                                setShowPaymentModal(true);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-electricBlue rounded-lg text-sm font-medium hover:bg-electricBlue/80 transition-colors"
                            >
                              <CreditCard className="h-4 w-4" />
                              Complete Payment
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber" />
                            <span className="text-sm text-amber">Waiting for buyer to complete payment...</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* STEP 3.5: Payment Awaiting Verification */}
                    {selectedThread.payment_status === "awaiting_verification" && (
                      <div className="bg-amber/10 border border-amber/30 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-amber">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Payment Verification Pending</span>
                        </div>
                        <p className="text-xs text-amber/80">
                          {selectedThread.buyer_id === user?.id 
                            ? "You've submitted manual payment proof. An admin will verify it shortly."
                            : "Buyer has submitted payment proof. Once an admin verifies it, you can proceed with delivery."}
                        </p>
                      </div>
                    )}
                    
                    {/* STEP 4: Transaction Completed - Show Rating */}
                    {selectedThread.delivery_status === "completed" && (
                      <div className="bg-emerald/10 border border-emerald/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-emerald">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Transaction Completed</span>
                        </div>
                        <p className="text-xs text-emerald/80">
                          The item has been delivered and payment has been released. 
                        </p>
                        {!selectedThread.has_reviewed ? (
                          <Button 
                            onClick={() => setShowReviewModal(true)}
                            className="w-full bg-emerald hover:bg-emerald/80 gap-2 h-9 text-xs"
                          >
                            <Star className="h-3 w-3 fill-white" />
                            Rate {selectedThread.other_user?.full_name || "User"}
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-emerald font-medium bg-emerald/20 px-2 py-1 rounded-full w-fit">
                            <Star className="h-2 w-2 fill-emerald" />
                            Rated
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* STEP 3: Payment Authorized - Delivery & Confirmation */}
                    {selectedThread.payment_status === "authorized" && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald" />
                          <span className="text-sm text-emerald">
                            {selectedThread.delivery_status === "completed" 
                              ? "Delivery confirmed & paid" 
                              : "Payment secured in escrow - waiting for delivery"}
                          </span>
                        </div>
                        {selectedThread.delivery_status !== "completed" && selectedThread.buyer_id === user?.id && (
                          <button
                            onClick={() => {
                              setDeliveryMode("buyer");
                              setShowDeliveryModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald rounded-lg text-sm font-medium hover:bg-emerald/80 transition-colors"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {selectedThread.traveler_confirmed_delivery ? "Confirm Receipt" : "View OTP"}
                          </button>
                        )}
                        {selectedThread.delivery_status !== "completed" && selectedThread.traveler_id === user?.id && (
                          <button
                            onClick={() => {
                              setDeliveryMode("traveler");
                              setShowDeliveryModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-electricBlue rounded-lg text-sm font-medium hover:bg-electricBlue/80 transition-colors"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {selectedThread.buyer_confirmed_receipt ? "Enter OTP" : "Confirm Delivery"}
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* STEP 4: Complete */}
                    {selectedThread.payment_status === "captured" && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald" />
                        <span className="text-sm text-emerald">Transaction complete - payment released to traveler</span>
                      </div>
                    )}
                    
                    {/* Offer Declined */}
                    {selectedThread.offer_status === "declined" && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-rose-400" />
                        <span className="text-sm text-rose-300">Offer was declined</span>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-divider">
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
                      OTP is required to release funds after delivery
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
          agreedAmount={parseFloat(agreedAmount) || 0}
          offerId={selectedThread.offer_id || ""}
          buyerId={selectedThread.buyer_id}
          travelerId={selectedThread.traveler_id}
          itemDescription={selectedThread.post?.content?.slice(0, 50) || "Delivery service"}
          onAgreedAmountUpdate={setAgreedAmount}
          onPaymentSuccess={async (paymentRef) => {
            // Update database with payment - now authorized (held in escrow)
            if (supabase && selectedThread.offer_id) {
              await supabase
                .from("post_offers")
                .update({ 
                  payment_intent_id: paymentRef,
                  payment_status: "authorized"
                })
                .eq("id", selectedThread.offer_id);
              
              // Notify traveler
              await supabase.from("notifications").insert({
                recipient_id: selectedThread.traveler_id,
                sender_id: user?.id,
                type: "escrow_update",
                title: "Payment received!",
                message: "Buyer has paid. Deliver the item to receive funds."
              });
              
              // Refresh threads
              setThreads(prev => prev.map(t => 
                t.id === selectedThread.id 
                  ? { ...t, payment_status: "authorized", payment_intent_id: paymentRef }
                  : t
              ));
            }
            setShowPaymentModal(false);
          }}
        />
      )}

      {/* Review Modal */}
      {selectedThread && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          targetName={selectedThread.other_user?.full_name || "User"}
          offerId={selectedThread.offer_id || ""}
          targetId={selectedThread.other_user?.id || ""}
          onSuccess={fetchThreads}
        />
      )}
      
      {/* Delivery OTP Modal */}
      {selectedThread && (
        <DeliveryOTP
          isOpen={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          offer={{
            id: selectedThread.offer_id || "",
            post_id: selectedThread.post_id,
            offerer_id: "",
            buyer_id: selectedThread.buyer_id,
            traveler_id: selectedThread.traveler_id,
            message: null,
            proposed_price_tnd: selectedThread.proposed_price_tnd || null,
            item_price_tnd: selectedThread.item_price_tnd || null,
            amount_tnd: selectedThread.amount_tnd || null,
            platform_fee_tnd: selectedThread.platform_fee_tnd || null,
            platform_fee_rate: selectedThread.platform_fee_rate || null,
            total_paid_tnd: selectedThread.total_paid_tnd || null,
            payment_intent_id: selectedThread.payment_intent_id || null,
            payment_method: selectedThread.payment_method || null,
            status: selectedThread.offer_status || "pending",
            payment_status: selectedThread.payment_status || null,
            delivery_status: selectedThread.delivery_status || null,
            delivery_otp: selectedThread.delivery_otp || null,
            otp_generated_at: null,
            traveler_confirmed_delivery: selectedThread.traveler_confirmed_delivery || null,
            traveler_confirmed_at: null,
            buyer_confirmed_receipt: selectedThread.buyer_confirmed_receipt || null,
            buyer_confirmed_at: null,
            otp_verified: selectedThread.otp_verified || null,
            otp_verified_at: null,
            payment_released: selectedThread.payment_released || null,
            payment_released_at: null,
            created_at: selectedThread.created_at,
            updated_at: selectedThread.created_at,
            completed_at: null
          }}
          mode={deliveryMode}
          userId={user?.id || ""}
          onStageChange={(stage) => {
            // Update local state when delivery stages change
            if (stage === "traveler_confirmed") {
              setThreads(prev => prev.map(t => 
                t.id === selectedThread.id 
                  ? { ...t, traveler_confirmed_delivery: true, delivery_status: "delivered" }
                  : t
              ));
              setSelectedThread(prev => prev ? {
                ...prev, 
                traveler_confirmed_delivery: true,
                delivery_status: "delivered"
              } : null);
            } else if (stage === "buyer_confirmed") {
              setThreads(prev => prev.map(t => 
                t.id === selectedThread.id 
                  ? { ...t, buyer_confirmed_receipt: true, delivery_status: "buyer_confirmed" }
                  : t
              ));
              setSelectedThread(prev => prev ? {
                ...prev, 
                buyer_confirmed_receipt: true,
                delivery_status: "buyer_confirmed"
              } : null);
            }
          }}
          onConfirmed={() => {
            // Update local state - full completion
            setThreads(prev => prev.map(t => 
              t.id === selectedThread.id 
                ? { ...t, payment_status: "captured", delivery_status: "completed", payment_released: true, otp_verified: true }
                : t
            ));
            setSelectedThread(prev => prev ? {
              ...prev, 
              payment_status: "captured", 
              delivery_status: "completed",
              payment_released: true,
              otp_verified: true
            } : null);
          }}
        />
      )}
    </AppShell>
  );
}
