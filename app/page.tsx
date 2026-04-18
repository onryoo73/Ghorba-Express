"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/client";
import { PostComposer } from "@/components/post-composer";
import { FeedPost } from "@/components/feed-post";
import { AppShell } from "@/components/app-shell";
import { TrendingUp, Package, Plane, Loader2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePosts } from "@/lib/hooks/use-posts";
import { useTrips } from "@/lib/hooks/use-trips";
import Link from "next/link";

export default function Page(): JSX.Element {
  const { t } = useI18n();
  const { posts, loading, error, refresh } = usePosts({ status: "active", limit: 20 });
  const { trips, loading: tripsLoading } = useTrips({ status: "open", limit: 5 });
  const [filter, setFilter] = useState<"all" | "request" | "trip">("all");

  const filteredPosts = filter === "all"
    ? posts
    : posts.filter(p => p.type === filter);

  return (
    <AppShell>
      {/* Hero CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <Card className="p-6 bg-gradient-to-r from-electricBlue/10 to-emerald/10 border-electricBlue/20 dark:from-electricBlue/20 dark:to-emerald/20 dark:border-electricBlue/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1">{t('home.hero.title')}</h2>
              <p className="text-sm text-muted">{t('home.hero.description')}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/trips">
                <Button variant="secondary" className="gap-2">
                  <Plane className="h-4 w-4" />
                  {t('nav.trips')}
                </Button>
              </Link>
              <Link href="/dashboard/traveler">
                <Button className="gap-2 bg-emerald hover:bg-emerald/80">
                  <Package className="h-4 w-4" />
                  Post a Trip
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Main Feed Layout */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className="p-4 sticky top-4">
            <h3 className="font-semibold mb-3">{t('home.filters.title')}</h3>
            <div className="space-y-2">
              <button
                onClick={() => setFilter("all")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                  filter === "all" ? "bg-surface-hover" : "hover:bg-surface-hover"
                }`}
              >
                <TrendingUp className="h-4 w-4 text-electricBlue" />
                {t('home.filters.all')}
              </button>
              <button
                onClick={() => setFilter("request")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                  filter === "request" ? "bg-surface-hover" : "hover:bg-surface-hover"
                }`}
              >
                <Package className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                {t('home.filters.requests')}
              </button>
              <button
                onClick={() => setFilter("trip")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                  filter === "trip" ? "bg-surface-hover" : "hover:bg-surface-hover"
                }`}
              >
                <Plane className="h-4 w-4 text-emerald" />
                {t('home.filters.trips')}
              </button>
            </div>
          </Card>

          <Card className="p-4 sticky top-48">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{t('home.upcomingTrips')}</h3>
              <Link href="/trips" className="text-xs text-electricBlue hover:underline">
                {t('home.viewAll')}
              </Link>
            </div>
            {tripsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-electricBlue" />
              </div>
            ) : trips.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No upcoming trips</p>
            ) : (
              <div className="space-y-3">
                {trips.slice(0, 4).map((trip) => (
                  <Link key={trip.id} href="/trips">
                    <div className="flex justify-between items-center py-2 hover:bg-surface-hover rounded-lg px-2 -mx-2 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-medium">{trip.origin} → {trip.destination}</p>
                        <p className="text-xs text-muted">
                          {new Date(trip.departure_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-xs text-emerald font-medium">{trip.weight_available_kg}kg</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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
            <div className="text-center py-8 text-rose-600 dark:text-rose-300">
              {t('home.feed.error')}
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-muted" />
              </div>
              <p className="text-muted">{t('home.feed.empty')}</p>
            </div>
          )}

          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))}
          </div>

          {filteredPosts.length === 0 && !loading && filter !== "all" && (
            <div className="text-center py-8 text-muted">
              <p>{filter === "request" ? t('home.filters.requests') : t('home.filters.trips')} not found.</p>
              <button
                onClick={() => setFilter("all")}
                className="text-electricBlue hover:underline text-sm mt-2"
              >
                {t('home.filters.all')}
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className="p-4 sticky top-4">
            <h3 className="font-semibold mb-3">{t('home.howItWorks.title')}</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-electricBlue/20 flex items-center justify-center text-sm font-bold text-electricBlue shrink-0">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">{t('home.howItWorks.step1.title')}</p>
                  <p className="text-xs text-muted">{t('home.howItWorks.step1.description')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald/20 flex items-center justify-center text-sm font-bold text-emerald shrink-0">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">{t('home.howItWorks.step2.title')}</p>
                  <p className="text-xs text-muted">{t('home.howItWorks.step2.description')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-400 shrink-0">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">{t('home.howItWorks.step3.title')}</p>
                  <p className="text-xs text-muted">{t('home.howItWorks.step3.description')}</p>
                </div>
              </div>
            </div>
            <Link href="/dashboard/buyer">
              <Button variant="secondary" className="w-full mt-4 text-xs">
                Create Your First Order
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </Card>

          <Card className="p-4 sticky top-48">
            <h3 className="font-semibold mb-3 text-sm">Trending Needs</h3>
            <div className="flex flex-wrap gap-2">
              {["Electronics", "Cosmetics", "Fashion", "Books", "Toys"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-surface text-xs hover:bg-surface-hover cursor-pointer transition-colors"
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
