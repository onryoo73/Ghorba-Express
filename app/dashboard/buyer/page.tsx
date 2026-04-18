"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatPanel } from "@/components/chat-panel";
import { DeliveryOTP } from "@/components/delivery-otp";
import { PaymentModal } from "@/components/payment-modal";
import { supabase } from "@/lib/supabase/client";
import { useAuthSession } from "@/lib/use-auth-session";
import { useI18n } from "@/lib/i18n/client";
import { 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Plus,
  MapPin, 
  Wallet,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PostOffer {
  id: string;
  post_id: string;
  offerer_id: string;
  proposed_price_tnd: number;
  amount_tnd: number;
  status: string;
  payment_status: string;
  delivery_status: string;
  created_at: string;
  traveler?: { full_name: string };
  post?: {
    id: string;
    item_name: string;
    origin: string;
    destination: string;
  };
}

interface BuyerPost {
  id: string;
  item_name: string;
  origin: string;
  destination: string;
  reward_tnd: number;
  status: string;
  type: string;
  created_at: string;
}

interface BuyerStats {
  totalSpent: number;
  activeOrders: number;
  completedOrders: number;
  pendingOffers: number;
}

export default function BuyerDashboardPage(): JSX.Element {
  const { user } = useAuthSession();
  const { t } = useI18n();
  const [offers, setOffers] = useState<PostOffer[]>([]);
  const [posts, setPosts] = useState<BuyerPost[]>([]);
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChatOfferId, setActiveChatOfferId] = useState<string | null>(null);
  const [activeOtpOffer, setActiveOtpOffer] = useState<PostOffer | null>(null);
  const [activePaymentOffer, setActivePaymentOffer] = useState<PostOffer | null>(null);

  const loadData = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      // Fetch user's posts
      const { data: postsData } = await supabase!
        .from("posts")
        .select("id, item_name, origin, destination, reward_tnd, status, type, created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });
      setPosts((postsData || []) as BuyerPost[]);

      // Fetch offers where user is the buyer
      const { data: offersData } = await supabase!
        .from("post_offers")
        .select(`
          id,
          post_id,
          offerer_id,
          proposed_price_tnd,
          amount_tnd,
          status,
          payment_status,
          delivery_status,
          created_at,
          traveler:profiles!offerer_id(full_name),
          post:posts!inner(id, item_name, origin, destination)
        `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      
      const formattedOffers = (offersData || []).map((o: any) => ({
        ...o,
        traveler: Array.isArray(o.traveler) ? o.traveler[0] : o.traveler,
        post: Array.isArray(o.post) ? o.post[0] : o.post
      }));
      setOffers(formattedOffers as PostOffer[]);

      // Calculate stats
      const completedOffers = formattedOffers.filter((o: PostOffer) => o.status === "completed");
      const activeOffers = formattedOffers.filter((o: PostOffer) => 
        ["pending", "accepted", "in_transit"].includes(o.status) || 
        (o.status === "completed" && o.payment_status !== "captured")
      );
      const pendingOffers = formattedOffers.filter((o: PostOffer) => o.status === "pending");

      setStats({
        totalSpent: completedOffers.reduce((sum: number, o: PostOffer) => sum + (o.amount_tnd || o.proposed_price_tnd || 0), 0),
        activeOrders: activeOffers.length,
        completedOrders: completedOffers.length,
        pendingOffers: pendingOffers.length
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user]);

  const getDeliveryStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return t('admin.status.buyerPending');
      case "in_transit": return t('orders.status.inTransit');
      case "delivered": return t('admin.status.readyRelease');
      case "buyer_confirmed": return t('admin.status.readyRelease');
      case "completed": return t('orders.status.completed');
      default: return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return t('admin.status.buyerPending');
      case "authorized": return t('admin.status.buyerApproved');
      case "captured": return t('admin.status.released');
      default: return status;
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-4"
    >
      <div className={`p-2 rounded-xl w-fit ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </motion.div>
  );

  return (
    <AppShell>
      <DashboardGuard allowedRoles={["buyer", "both"]}>
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">{t('buyerDashboard.title')}</h1>
              <p className="text-muted">{t('buyerDashboard.subtitle')}</p>
            </div>
            <Link href="/">
              <Button className="bg-electricBlue gap-2">
                <Plus className="h-4 w-4" /> {t('buyerDashboard.newRequest')}
              </Button>
            </Link>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={DollarSign} label={t('buyerDashboard.stats.totalSpent')} value={`${stats.totalSpent.toFixed(2)} TND`} color="bg-amber-500/20 text-amber-400" />
              <StatCard icon={Package} label={t('buyerDashboard.stats.activeOrders')} value={stats.activeOrders} color="bg-blue-500/20 text-blue-400" />
              <StatCard icon={CheckCircle2} label={t('buyerDashboard.stats.completedOrders')} value={stats.completedOrders} color="bg-emerald-500/20 text-emerald-400" />
              <StatCard icon={Clock} label={t('buyerDashboard.stats.pendingOffers')} value={stats.pendingOffers} color="bg-amber-500/20 text-amber-400" />
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose-400/20 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />{error}
            </div>
          )}

          {/* Active Orders */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-electricBlue" />
              {t('orders.title')}
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-electricBlue/30 border-t-electricBlue rounded-full mx-auto" />
                <p className="text-muted mt-2">{t('common.loading')}</p>
              </div>
            ) : offers.length > 0 ? (
              <div className="space-y-4">
                {offers.map((offer, i) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={cn(
                            "text-[10px]",
                            offer.status === "completed" ? "bg-emerald/20 text-emerald" :
                            offer.status === "accepted" ? "bg-blue/20 text-blue" :
                            offer.status === "pending" ? "bg-amber/20 text-amber" :
                            "bg-white/10 text-muted"
                          )}>
                            {t(`orders.status.${offer.status}` as any) || offer.status}
                          </Badge>
                          <Badge className="text-[10px] bg-white/10 text-muted">
                            {getDeliveryStatusLabel(offer.delivery_status)}
                          </Badge>
                        </div>
                        <p className="font-medium">{offer.post?.item_name || "Order"}</p>
                        {offer.post && (
                          <p className="text-sm text-muted flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {offer.post.origin} → {offer.post.destination}
                          </p>
                        )}
                        {offer.traveler && (
                          <p className="text-xs text-muted mt-1">{t('auth.role.traveler')}: {offer.traveler.full_name}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-emerald">{(offer.amount_tnd || offer.proposed_price_tnd || 0).toFixed(2)} TND</p>
                          <p className="text-[10px] text-muted">{getPaymentStatusLabel(offer.payment_status)}</p>
                        </div>

                        <div className="flex gap-2">
                          {offer.status === "accepted" && offer.payment_status === "pending" && (
                            <Button className="bg-emerald hover:bg-emerald/80 gap-1 h-8 text-xs px-2" onClick={() => setActivePaymentOffer(offer)}>
                              <Wallet className="h-3 w-3" />{t('wallet.title')}
                            </Button>
                          )}
                          {offer.delivery_status === "delivered" && (
                            <Button className="bg-electricBlue hover:bg-electricBlue/80 gap-1 h-8 text-xs px-2" onClick={() => setActiveOtpOffer(offer)}>
                              <Shield className="h-3 w-3" />{t('common.confirm')}
                            </Button>
                          )}
                          {offer.status !== "pending" && (
                            <Button variant="secondary" onClick={() => setActiveChatOfferId(offer.id)} className="gap-1 h-8 text-xs px-2">
                              <MessageSquare className="h-3 w-3" />{t('dashboard.quickActions.viewMessages')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted mx-auto mb-4" />
                <p className="text-muted mb-4">{t('orders.noOrders')}</p>
                <Link href="/"><Button className="bg-electricBlue gap-2"><Plus className="h-4 w-4" />{t('orders.createOrder')}</Button></Link>
              </div>
            )}
          </Card>

          {/* My Posts */}
          {posts.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-electricBlue" />
                Your Requests
              </h2>
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{post.item_name}</p>
                      <p className="text-xs text-muted">{post.origin} → {post.destination} · {post.reward_tnd?.toFixed(2)} TND</p>
                    </div>
                    <Badge className={cn(
                      "text-[10px]",
                      post.status === "open" ? "bg-emerald/20 text-emerald" :
                      post.status === "matched" ? "bg-blue/20 text-blue" :
                      "bg-white/10 text-muted"
                    )}>
                      {post.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeChatOfferId && <ChatPanel orderId={activeChatOfferId} />}
          {activeOtpOffer && (
            <DeliveryOTP
              isOpen={!!activeOtpOffer}
              onClose={() => setActiveOtpOffer(null)}
              offer={activeOtpOffer as any}
              mode="buyer"
              userId={user?.id || ""}
              onConfirmed={() => { setActiveOtpOffer(null); loadData(); }}
            />
          )}
          {activePaymentOffer && (
            <PaymentModal
              isOpen={!!activePaymentOffer}
              onClose={() => setActivePaymentOffer(null)}
              offerId={activePaymentOffer.id}
              agreedAmount={activePaymentOffer.amount_tnd || activePaymentOffer.proposed_price_tnd || 0}
              buyerId={user?.id || ""}
              travelerId={activePaymentOffer.offerer_id}
              itemDescription={activePaymentOffer.post?.item_name || ""}
              onPaymentSuccess={() => { setActivePaymentOffer(null); loadData(); }}
            />
          )}
        </div>
      </DashboardGuard>
    </AppShell>
  );
}
