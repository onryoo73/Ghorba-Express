"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/lib/use-auth-session";
import { supabase } from "@/lib/supabase/client";
import { 
  Package, 
  Truck, 
  MessageSquare, 
  Wallet, 
  TrendingUp, 
  Star,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Shield,
  MapPin,
  DollarSign,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  activeOrders: number;
  completedOrders: number;
  totalSpent: number;
  totalEarnings: number;
  activeTrips: number;
  unreadMessages: number;
  rating: number;
  deliveriesCount: number;
}

interface RecentActivity {
  id: string;
  type: "order" | "trip" | "message" | "payment";
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export const dynamic = "force-dynamic";

export default function DashboardPage(): JSX.Element {
  const { isAuthenticated, role, effectiveRole, isAdmin, profile, user } = useAuthSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) return;
    
    const loadDashboardData = async () => {
      try {
        // Load orders data
        const { data: ordersData } = await supabase!
          .from("post_offers")
          .select("payment_status, amount_tnd, buyer_id, traveler_id")
          .or(`buyer_id.eq.${user.id},traveler_id.eq.${user.id}`);

        // Load trips data from trips table (not posts)
        const { data: tripsData } = await supabase!
          .from("trips")
          .select("status")
          .eq("traveler_id", user.id);

        // Load unread messages
        const { count: unreadCount } = await supabase!
          .from("chat_messages")
          .select("*", { count: "exact" })
          .eq("recipient_id", user.id)
          .eq("is_read", false);

        // Calculate stats
        const activeOrders = ordersData?.filter(o => 
          o.payment_status === "authorized" || o.payment_status === "pending"
        ).length || 0;
        
        const completedOrders = ordersData?.filter(o => 
          o.payment_status === "captured"
        ).length || 0;

        const totalSpent = ordersData
          ?.filter(o => o.buyer_id === user.id && o.payment_status === "captured")
          .reduce((sum, o) => sum + (o.amount_tnd || 0), 0) || 0;

        const totalEarnings = ordersData
          ?.filter(o => o.traveler_id === user.id && o.payment_status === "captured")
          .reduce((sum, o) => sum + (o.amount_tnd || 0), 0) || 0;

        const activeTrips = tripsData?.filter(t => t.status === "open").length || 0;

        setStats({
          activeOrders,
          completedOrders,
          totalSpent,
          totalEarnings,
          activeTrips,
          unreadMessages: unreadCount || 0,
          rating: profile?.rating || 5,
          deliveriesCount: profile?.total_deliveries || 0
        });

        // Load real notifications as activity
        const { data: notifsData } = await supabase!
          .from("notifications")
          .select("id, title, message, type, created_at, is_read")
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        // Map notifications to activity items
        const realActivities: RecentActivity[] = (notifsData || []).map((n: any) => ({
          id: n.id,
          type: (n.type === "escrow_update" || n.type === "payment" ? "payment" :
                n.type === "new_message" || n.type === "chat" ? "message" :
                n.type === "new_offer" || n.type === "offer" ? "order" :
                "trip") as RecentActivity["type"],
          title: n.title,
          description: n.message || "",
          timestamp: new Date(n.created_at).toLocaleString(),
          status: n.is_read ? undefined : "new"
        }));

        // If no notifications yet, build from recent offers
        if (realActivities.length === 0) {
          const { data: recentOffers } = await supabase!
            .from("post_offers")
            .select(`
              id, buyer_id, offerer_id, status, payment_status, delivery_status, created_at, amount_tnd,
              traveler:profiles!traveler_id(full_name),
              buyer:profiles!buyer_id(full_name),
              post:posts!inner(item_name)
            `)
            .or(`buyer_id.eq.${user.id},offerer_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(5);

          for (const o of (recentOffers || [])) {
            const isBuyer = o.buyer_id === user.id || (o as any).buyer?.id === user.id;
            const travelerName = Array.isArray((o as any).traveler) ? (o as any).traveler[0]?.full_name : (o as any).traveler?.full_name || "Traveler";
            const buyerName = Array.isArray((o as any).buyer) ? (o as any).buyer[0]?.full_name : (o as any).buyer?.full_name || "Buyer";
            const itemName = Array.isArray((o as any).post) ? (o as any).post[0]?.item_name : (o as any).post?.item_name || "item";

            if (isBuyer) {
              realActivities.push({
                id: o.id, type: "order",
                title: `Offer for ${itemName}`,
                description: `${travelerName} offered to deliver · ${(o as any).amount_tnd?.toFixed(2) || "0.00"} TND`,
                timestamp: new Date(o.created_at).toLocaleString(),
                status: o.status
              });
            } else {
              realActivities.push({
                id: o.id, type: "payment",
                title: o.status === "completed" ? "Payment received" : `Delivery: ${o.delivery_status}`,
                description: `${buyerName} · ${(o as any).amount_tnd?.toFixed(2) || "0.00"} TND`,
                timestamp: new Date(o.created_at).toLocaleString(),
                status: o.status
              });
            }
          }
        }

        setActivities(realActivities);

      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, profile]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "buyer": return "Buyer";
      case "traveler": return "Traveler";
      case "both": return "Buyer + Traveler";
      default: return role;
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    trend,
    color 
  }: { 
    icon: any, 
    label: string, 
    value: string | number, 
    trend?: string,
    color: string 
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-4"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className="text-xs text-emerald flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </motion.div>
  );

  const QuickAction = ({ 
    icon: Icon, 
    label, 
    href, 
    color 
  }: { 
    icon: any, 
    label: string, 
    href: string, 
    color: string 
  }) => (
    <Link href={href as any}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors ${color}`}
      >
        <div className="p-2 rounded-xl bg-white/10">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-medium">{label}</span>
        <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
      </motion.div>
    </Link>
  );

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold mb-4">Welcome to Ghorba Express</h1>
            <p className="text-muted mb-6">Sign in to access your dashboard</p>
            <Link href="/auth">
              <Button className="bg-electricBlue">Sign In</Button>
            </Link>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {getGreeting()}, <Link href={`/profile/${user?.id}`} className="hover:text-electricBlue transition-colors">{profile?.full_name?.split(" ")[0] || "User"}</Link>!
          </h1>
          <p className="text-muted">
            {getRoleLabel(role || "buyer")} • {isAdmin && "Admin • "}
            {stats?.rating.toFixed(1)} ⭐ Rating
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {(effectiveRole === "buyer" || role === "both") && (
              <>
                <StatCard
                  icon={Package}
                  label="Active Orders"
                  value={stats.activeOrders}
                  color="bg-blue-500/20 text-blue-400"
                />
                <StatCard
                  icon={DollarSign}
                  label="Total Spent"
                  value={`${stats.totalSpent.toFixed(2)} TND`}
                  color="bg-amber-500/20 text-amber-400"
                />
              </>
            )}
            {(effectiveRole === "traveler" || role === "both") && (
              <>
                <StatCard
                  icon={Truck}
                  label="Active Trips"
                  value={stats.activeTrips}
                  color="bg-emerald-500/20 text-emerald-400"
                />
                <StatCard
                  icon={Wallet}
                  label="Total Earnings"
                  value={`${stats.totalEarnings.toFixed(2)} TND`}
                  trend={`${stats.deliveriesCount} deliveries`}
                  color="bg-purple-500/20 text-purple-400"
                />
              </>
            )}
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={stats.completedOrders}
              color="bg-emerald-500/20 text-emerald-400"
            />
            <StatCard
              icon={MessageSquare}
              label="Unread Messages"
              value={stats.unreadMessages}
              color="bg-rose-500/20 text-rose-400"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {(effectiveRole === "traveler" || role === "traveler") && (
            <QuickAction
              icon={Plus}
              label="Post a Trip"
              href="/dashboard/traveler"
              color="hover:border-emerald-500/30"
            />
          )}
          {(effectiveRole === "buyer" || role === "buyer") && (
            <QuickAction
              icon={Package}
              label="Create Order"
              href="/dashboard/buyer"
              color="hover:border-blue-500/30"
            />
          )}
          <QuickAction
            icon={MessageSquare}
            label="View Messages"
            href="/messages"
            color="hover:border-electricBlue/30"
          />
          <QuickAction
            icon={MapPin}
            label="Browse Posts"
            href="/"
            color="hover:border-purple-500/30"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-electricBlue" />
                  Recent Activity
                </h2>
                <Link href="/messages" className="text-sm text-electricBlue hover:underline">
                  View all
                </Link>
              </div>
              
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 p-4 bg-white/5 rounded-xl"
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        activity.type === "order" && "bg-blue-500/20 text-blue-400",
                        activity.type === "message" && "bg-electricBlue/20 text-electricBlue",
                        activity.type === "trip" && "bg-emerald-500/20 text-emerald-400",
                        activity.type === "payment" && "bg-amber-500/20 text-amber-400"
                      )}>
                        {activity.type === "order" && <Package className="h-4 w-4" />}
                        {activity.type === "message" && <MessageSquare className="h-4 w-4" />}
                        {activity.type === "trip" && <Truck className="h-4 w-4" />}
                        {activity.type === "payment" && <DollarSign className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted">{activity.description}</p>
                        <p className="text-xs text-muted mt-1">{activity.timestamp}</p>
                      </div>
                      {activity.status && (
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs",
                          activity.status === "new" && "bg-electricBlue/20 text-electricBlue",
                          activity.status === "pending" && "bg-amber-500/20 text-amber-400",
                          activity.status === "accepted" && "bg-blue-500/20 text-blue-400",
                          activity.status === "completed" && "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {activity.status}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-8">No recent activity</p>
              )}
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Your Profile</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber fill-current" />
                    <span>{stats?.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Deliveries</span>
                  <span>{stats?.deliveriesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Role</span>
                  <span className="capitalize">{role}</span>
                </div>
              </div>
              <Link href="/profile">
                <Button variant="secondary" className="w-full mt-4">
                  Edit Profile
                </Button>
              </Link>
            </Card>

            {/* Admin Access */}
            {isAdmin && (
              <Card className="p-6 bg-gradient-to-br from-electricBlue/20 to-purple-600/20 border-electricBlue/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-electricBlue/20 rounded-lg">
                    <Shield className="h-5 w-5 text-electricBlue" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Admin Panel</h3>
                    <p className="text-sm text-muted">Manage disputes & users</p>
                  </div>
                </div>
                <Link href="/dashboard/admin">
                  <Button className="w-full bg-electricBlue">
                    Open Admin Dashboard
                  </Button>
                </Link>
              </Card>
            )}

            {/* Notifications */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </h3>
              <p className="text-sm text-muted mb-4">
                You have {stats?.unreadMessages || 0} unread messages
              </p>
              <Link href="/messages">
                <Button variant="secondary" className="w-full">
                  View Messages
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
