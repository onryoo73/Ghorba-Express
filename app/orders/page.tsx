"use client";

import { motion } from "framer-motion";
import { ShoppingBag, MapPin, Package, Search, TrendingUp, ShieldCheck, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FeedPost } from "@/components/feed-post";
import { PostComposer } from "@/components/post-composer";

// Buyer requests as social posts
const buyerRequests = [
  {
    id: "r1",
    type: "request" as const,
    author: { name: "Ines M.", rating: 4.9, verified: true },
    content: "Hey everyone! Looking for someone coming from Paris to Tunis. I need a specific laptop charger (MacBook Pro 96W) that I can only find at Apple Store Champs-Élysées. Will pay full price + 50 TND reward! 💻",
    from: "Paris",
    to: "Tunis",
    price: "120",
    reward: "50",
    likes: 12,
    comments: 4,
    timestamp: "2 hours ago"
  },
  {
    id: "r2",
    type: "request" as const,
    author: { name: "Karim D.", rating: 4.7, verified: false },
    content: "Anyone traveling from Istanbul to Sfax soon? Need some Turkish coffee and baklava from my favorite shop in Taksim. Can pay upfront with proof! ☕🥐",
    from: "Istanbul",
    to: "Sfax",
    price: "80",
    reward: "30",
    likes: 8,
    comments: 2,
    timestamp: "6 hours ago"
  },
  {
    id: "r3",
    type: "request" as const,
    author: { name: "Yasmine R.", rating: 5.0, verified: true },
    content: "Looking for Italian skincare products from Milan - specifically The Ordinary and some local pharmacy brands. Traveling to Nabeul area. Will make it worth your while! 🧴",
    from: "Milan",
    to: "Nabeul",
    price: "200",
    reward: "60",
    likes: 15,
    comments: 5,
    timestamp: "12 hours ago"
  },
  {
    id: "r4",
    type: "request" as const,
    author: { name: "Mohamed A.", rating: 4.6, verified: false },
    content: "Need children's books in French from any European city. Looking for educational books for ages 5-8. About 2-3kg max. Can meet anywhere in Tunis area.",
    from: "Paris",
    to: "Tunis",
    price: "60",
    reward: "25",
    likes: 5,
    comments: 1,
    timestamp: "1 day ago"
  }
];

const popularNeeds = [
  { tag: "Electronics", count: 45 },
  { tag: "Cosmetics", count: 32 },
  { tag: "Fashion", count: 28 },
  { tag: "Books", count: 15 },
  { tag: "Toys", count: 12 },
  { tag: "Medicine", count: 8 }
];

const timeline = ["Deposited", "Funds Locked", "In Transit", "Delivered", "Released"];

export default function OrdersPage(): JSX.Element {
  return (
    <AppShell>
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-rose-400/20">
            <ShoppingBag className="h-6 w-6 text-rose-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Buyer Requests</h1>
            <p className="text-sm text-muted">Browse what people need or post your own request</p>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5">
                <Search className="h-4 w-4 text-muted" />
                <Input
                  placeholder="Search requests..."
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 min-w-[140px]">
                <MapPin className="h-4 w-4 text-electricBlue" />
                <Input
                  placeholder="From"
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 min-w-[140px]">
                <MapPin className="h-4 w-4 text-emerald" />
                <Input
                  placeholder="To"
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
              </div>
              <Button className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </Card>

          {/* Composer */}
          <PostComposer />

          {/* Feed */}
          <div className="space-y-4">
            {buyerRequests.map((post) => (
              <FeedPost key={post.id} {...post} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center py-4">
            <button className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-sm text-muted">
              Load more requests...
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Post Request CTA */}
          <Card className="p-4 border-rose-400/30 bg-rose-400/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-rose-400/20">
                <Plus className="h-5 w-5 text-rose-300" />
              </div>
              <h3 className="font-semibold">Need something?</h3>
            </div>
            <p className="text-sm text-muted mb-4">
              Post a request and let travelers bring it to you. Escrow protected!
            </p>
            <Button className="w-full gap-2">
              <ShoppingBag className="h-4 w-4" />
              Post Request
            </Button>
          </Card>

          {/* Trending Needs */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-electricBlue" />
              <h3 className="font-semibold">Trending Needs</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularNeeds.map((need) => (
                <span
                  key={need.tag}
                  className="px-3 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/20 cursor-pointer transition-colors flex items-center gap-1"
                >
                  #{need.tag}
                  <span className="text-muted">({need.count})</span>
                </span>
              ))}
            </div>
          </Card>

          {/* Escrow Info */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-emerald" />
              <h3 className="font-semibold">Escrow Protection</h3>
            </div>
            <div className="space-y-3">
              {timeline.map((item, index) => (
                <div key={item} className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      index < 2
                        ? "bg-emerald shadow-[0_0_10px_rgba(47,204,154,0.8)]"
                        : "bg-white/20"
                    }`}
                  />
                  <p className={`text-sm ${index < 2 ? "" : "text-muted"}`}>{item}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-4">
              Your payment is held safely until delivery is confirmed
            </p>
          </Card>

          {/* Quick Stats */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Your Activity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-lg font-semibold text-electricBlue">3</p>
                <p className="text-xs text-muted">Active Requests</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <p className="text-lg font-semibold text-emerald">5</p>
                <p className="text-xs text-muted">Completed</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
