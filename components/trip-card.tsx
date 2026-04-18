"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Calendar, Weight, Star, BadgeCheck, Plane, MessageCircle, Clock, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/lib/use-auth-session";
import { supabase } from "@/lib/supabase/client";
import type { Trip } from "@/lib/hooks/use-trips";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps): JSX.Element {
  const { user } = useAuthSession();
  const router = useRouter();
  const [contacting, setContacting] = useState(false);
  
  const isOwnTrip = user?.id === trip.traveler_id;
  
  // Calculate days remaining until departure
  const daysRemaining = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const departure = new Date(trip.departure_date);
    departure.setHours(0, 0, 0, 0);
    const diffTime = departure.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  })();

  const daysText = daysRemaining < 0 
    ? "Departed" 
    : daysRemaining === 0 
    ? "Departs today!" 
    : daysRemaining === 1 
    ? "Departs tomorrow" 
    : `${daysRemaining} days left`;
  
  const statusColor = {
    open: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald",
    full: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
    completed: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
    cancelled: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
  }[trip.status] || "bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400";

  const formattedDate = new Date(trip.departure_date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  // Handle contacting the traveler - creates a chat thread and redirects to messages
  const handleContact = async () => {
    if (!user || !supabase) {
      router.push("/auth");
      return;
    }

    setContacting(true);
    try {
      // Check if a thread already exists for this trip between these users
      const { data: existingThread } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("traveler_id", trip.traveler_id)
        .eq("buyer_id", user.id)
        .eq("trip_id", trip.id)
        .maybeSingle();

      if (existingThread) {
        // Thread exists, go to messages
        router.push("/messages");
        return;
      }

      // Create a new thread for this trip
      const { data: newThread, error: threadError } = await supabase
        .from("chat_threads")
        .insert({
          trip_id: trip.id,
          traveler_id: trip.traveler_id,
          buyer_id: user.id
        })
        .select("id")
        .single();

      if (threadError) throw threadError;

      // Send an initial system message
      if (newThread) {
        await supabase.from("chat_messages").insert({
          thread_id: newThread.id,
          sender_id: user.id,
          message: `Hi! I saw your trip from ${trip.origin} to ${trip.destination} on ${formattedDate}. I'm interested in sending something with you.`
        });
      }

      router.push("/messages");
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setContacting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
        <Card className="p-5 hover:border-surface-hover transition-colors">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${trip.traveler_id}`} className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald to-electricBlue flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-emerald/50 transition-all">
                {trip.author?.full_name?.charAt(0) || "T"}
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${trip.traveler_id}`} className="font-medium hover:text-emerald transition-colors">
                    {trip.author?.full_name || "Traveler"}
                  </Link>
                  {trip.author?.verified && (
                    <BadgeCheck className="h-4 w-4 text-electricBlue" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  {trip.author?.rating && (
                    <>
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span>{trip.author.rating.toFixed(1)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Badge className={statusColor}>
              {trip.status}
            </Badge>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <MapPin className="h-5 w-5 text-electricBlue" />
              <span>{trip.origin}</span>
              <Plane className="h-4 w-4 text-emerald mx-2" />
              <MapPin className="h-5 w-5 text-emerald" />
              <span>{trip.destination}</span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4" />
                <span>{trip.weight_available_kg} kg available</span>
              </div>
              {trip.price_per_kg_tnd && (
                <div className="flex items-center gap-2 text-emerald font-medium">
                  <span>{trip.price_per_kg_tnd} TND/kg</span>
                </div>
              )}
            </div>

            {/* Days remaining badge */}
            {trip.status === "open" && daysRemaining >= 0 && (
              <div className={`flex items-center gap-2 text-sm font-medium ${
                daysRemaining <= 1 ? "text-rose-600 dark:text-rose-300" : daysRemaining <= 3 ? "text-amber-600 dark:text-amber-400" : "text-emerald"
              }`}>
                <Clock className="h-4 w-4" />
                <span>{daysText}</span>
              </div>
            )}
          </div>

          {trip.notes && (
            <p className="text-sm text-muted mb-4 border-t border-divider pt-4">
              {trip.notes}
            </p>
          )}

          {/* Contact button */}
          {!isOwnTrip && trip.status === "open" && daysRemaining >= 0 && (
            <div className="flex justify-end pt-2 border-t border-divider mt-4">
              <Button 
                onClick={handleContact} 
                disabled={contacting}
                className="gap-2"
              >
                {contacting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                {contacting ? "Connecting..." : "Contact Traveler"}
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
  );
}
