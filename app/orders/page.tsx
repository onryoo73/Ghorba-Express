"use client";

import { motion } from "framer-motion";
import { ShoppingBag, MapPin, Package, Search, TrendingUp, ShieldCheck, Plus, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FeedPost } from "@/components/feed-post";
import { PostComposer } from "@/components/post-composer";
import { usePosts } from "@/lib/hooks/use-posts";

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
  const { posts, loading, error, refresh } = usePosts({ type: "request", status: "active", limit: 20 });
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
          <PostComposer onPostCreated={refresh} />

          {/* Feed */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-electricBlue" />
            </div>
          )}
          
          {error && (
            <div className="text-center py-8 text-rose-300">
              Failed to load requests. Please try again.
            </div>
          )}
          
          <div className="space-y-4">
            {posts.map((post) => (
              <FeedPost key={post.id} post={post} />
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
