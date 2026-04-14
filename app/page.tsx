"use client";

import { motion } from "framer-motion";
import { PostComposer } from "@/components/post-composer";
import { FeedPost } from "@/components/feed-post";
import { AppShell } from "@/components/app-shell";
import { TrendingUp, Users, Package, Plane, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { usePosts } from "@/lib/hooks/use-posts";

const stats = [
  { icon: Users, label: "Active Users", value: "2.4K", color: "text-electricBlue" },
  { icon: Package, label: "Deliveries", value: "2,340+", color: "text-emerald" },
  { icon: Plane, label: "Active Trips", value: "84", color: "text-yellow-300" },
  { icon: TrendingUp, label: "Success Rate", value: "98.7%", color: "text-rose-300" }
];

export default function Page(): JSX.Element {
  const { posts, loading, error, refresh } = usePosts({ status: "active", limit: 20 });
  return (
    <AppShell>
      {/* Header Stats */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="grid grid-cols-4 gap-2 mb-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-3 text-center">
              <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-xs text-muted">{stat.label}</p>
              <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Main Feed Layout */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className="p-4 sticky top-4">
            <h3 className="font-semibold mb-3">Quick Filters</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-rose-300" />
                Buyer Requests
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center gap-2">
                <Plane className="h-4 w-4 text-emerald" />
                Traveler Trips
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-electricBlue" />
                Trending
              </button>
            </div>
          </Card>

          <Card className="p-4 sticky top-48">
            <h3 className="font-semibold mb-3 text-sm">Active Routes</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Paris → Tunis</span>
                <span className="text-emerald">12 active</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Istanbul → Sfax</span>
                <span className="text-emerald">8 active</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Milan → Nabeul</span>
                <span className="text-emerald">5 active</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-6 space-y-4">
          {/* Composer */}
          <PostComposer onPostCreated={refresh} />

          {/* Feed Posts */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-electricBlue" />
            </div>
          )}
          
          {error && (
            <div className="text-center py-8 text-rose-300">
              Failed to load posts. Please try again.
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
              Load more posts...
            </button>
          </div>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className="p-4 sticky top-4">
            <h3 className="font-semibold mb-3">Top Travelers</h3>
            <div className="space-y-3">
              {["Sami B.", "Leila K.", "Youssef A."].map((name, i) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-electricBlue/30 to-emerald/30 flex items-center justify-center text-sm font-semibold">
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted">{4.8 + i * 0.1} ⭐ • 50+ trips</p>
                  </div>
                  <button className="text-xs text-electricBlue hover:underline">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sticky top-48">
            <h3 className="font-semibold mb-3 text-sm">Trending Needs</h3>
            <div className="flex flex-wrap gap-2">
              {["Electronics", "Cosmetics", "Fashion", "Books", "Toys"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-white/10 text-xs hover:bg-white/20 cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
