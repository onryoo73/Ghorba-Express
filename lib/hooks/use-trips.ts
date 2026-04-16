"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export interface Trip {
  id: string;
  traveler_id: string;
  origin: string;
  destination: string;
  departure_date: string;
  weight_available_kg: number;
  price_per_kg_tnd: number | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string | null;
    rating: number;
    verified: boolean;
    avatar_url: string | null;
  } | null;
}

export function useTrips(options?: {
  status?: string;
  origin?: string;
  destination?: string;
  limit?: number;
}) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchTrips = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const opts = optionsRef.current;
      
      let query = supabase
        .from("trips")
        .select(`
          id,
          traveler_id,
          origin,
          destination,
          departure_date,
          weight_available_kg,
          price_per_kg_tnd,
          notes,
          status,
          created_at,
          updated_at,
          author:profiles!trips_traveler_id_fkey(full_name, rating, verified, avatar_url)
        `)
        .order("departure_date", { ascending: true });

      if (opts?.status) {
        query = query.eq("status", opts.status);
      }
      if (opts?.origin) {
        query = query.ilike("origin", `%${opts.origin}%`);
      }
      if (opts?.destination) {
        query = query.ilike("destination", `%${opts.destination}%`);
      }
      if (opts?.limit) {
        query = query.limit(opts.limit);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      // Supabase returns author as an array, we need to extract the first element
      const tripsWithAuthor = (data || []).map((trip: any) => ({
        ...trip,
        author: Array.isArray(trip.author) ? trip.author[0] : trip.author
      }));
      setTrips(tripsWithAuthor as Trip[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch trips"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips, options?.status, options?.origin, options?.destination]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!supabase) return;

    const subscription = supabase
      .channel("trips_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trips" },
        () => {
          // Refresh the list when a new trip is added
          fetchTrips();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTrips]);

  return { trips, loading, error, refresh: fetchTrips };
}
