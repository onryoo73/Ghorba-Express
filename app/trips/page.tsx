"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, MapPin, CalendarDays, Package, Search, Filter, TrendingUp, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TripCard } from "@/components/trip-card";
import { useTrips } from "@/lib/hooks/use-trips";

const popularRoutes = [
  { from: "Paris", to: "Tunis", trips: 12 },
  { from: "Istanbul", to: "Sfax", trips: 8 },
  { from: "Milan", to: "Nabeul", trips: 5 },
  { from: "Brussels", to: "Tunis", trips: 3 },
  { from: "London", to: "Tunis", trips: 4 }
];

export default function TripsPage(): JSX.Element {
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const { trips, loading, error, refresh } = useTrips({ 
    status: "open",
    limit: 20,
    origin: searchFrom || undefined,
    destination: searchTo || undefined
  });

  const handleSearch = () => {
    refresh();
  };

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
          <div className="p-2 rounded-xl bg-emerald/20">
            <Plane className="h-6 w-6 text-emerald" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Traveler Trips</h1>
            <p className="text-sm text-muted">Browse upcoming routes and available luggage space</p>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Search & Filters */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search Bar */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-surface">
                <MapPin className="h-4 w-4 text-electricBlue" />
                <Input
                  placeholder="From (city)"
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-surface">
                <MapPin className="h-4 w-4 text-emerald" />
                <Input
                  placeholder="To (city)"
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface min-w-[140px]">
                <CalendarDays className="h-4 w-4 text-yellow-300" />
                <Input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
              </div>
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </Card>

          {/* No composer here - trips are created via traveler dashboard */}
          
          {/* Feed */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-electricBlue" />
            </div>
          )}
                    
          {error && (
            <div className="text-center py-8 text-rose-300">
              Failed to load trips. Please try again.
            </div>
          )}
                    
          {!loading && trips.length === 0 && (
            <div className="text-center py-8 text-muted">
              <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No trips available at the moment.</p>
              <p className="text-sm mt-2">Check back later or create a trip if you're traveling!</p>
            </div>
          )}
          
          <div className="space-y-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center py-4">
            <button className="px-6 py-2 rounded-full bg-surface hover:bg-surface-hover transition-colors text-sm text-muted">
              Load more trips...
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Post Trip CTA */}
          <Card className="p-4 border-emerald/30 bg-emerald/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald/20">
                <Plane className="h-5 w-5 text-emerald" />
              </div>
              <h3 className="font-semibold">Traveling soon?</h3>
            </div>
            <p className="text-sm text-muted mb-4">
              Share your trip and earn money from your spare luggage space!
            </p>
            <Button className="w-full gap-2">
              <Plane className="h-4 w-4" />
              Post Your Trip
            </Button>
          </Card>

          {/* Popular Routes */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-electricBlue" />
              <h3 className="font-semibold">Popular Routes</h3>
            </div>
            <div className="space-y-3">
              {popularRoutes.map((route) => (
                <div
                  key={`${route.from}-${route.to}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-electricBlue" />
                    <span className="text-sm">{route.from}</span>
                    <span className="text-muted">→</span>
                    <span className="text-sm text-emerald">{route.to}</span>
                  </div>
                  <span className="text-xs text-muted">{route.trips} trips</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Filter by Space */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-rose-300" />
              <h3 className="font-semibold">Luggage Space</h3>
            </div>
            <div className="space-y-2">
              {["1-3 kg", "4-6 kg", "7-10 kg", "10+ kg"].map((range) => (
                <label key={range} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-sm">{range}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
