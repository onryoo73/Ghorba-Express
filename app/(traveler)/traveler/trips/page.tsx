"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

interface Trip {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  weight_available_kg: number;
  status: string;
}

export default function TravelerTripsPage(): JSX.Element {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");

  const loadTrips = async () => {
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("trips")
      .select("id,origin,destination,departure_date,weight_available_kg,status")
      .eq("traveler_id", user.id)
      .order("departure_date", { ascending: true });
    setTrips((data as Trip[] | null) ?? []);
  };

  useEffect(() => {
    void loadTrips();
  }, []);

  const createTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("trips").insert({
      traveler_id: user.id,
      origin,
      destination,
      departure_date: date,
      weight_available_kg: Number(weight)
    });
    setOrigin("");
    setDestination("");
    setDate("");
    setWeight("");
    await loadTrips();
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Traveler Dashboard - Trips</h1>
      <Card>
        <form className="grid gap-2 sm:grid-cols-2" onSubmit={(event) => void createTrip(event)}>
          <Input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Origin" required />
          <Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Destination" required />
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <Input type="number" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Weight KG" min="1" required />
          <Button className="sm:col-span-2">Create Trip</Button>
        </form>
      </Card>
      <div className="space-y-2">
        {trips.map((trip) => (
          <Card key={trip.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{trip.origin} to {trip.destination}</p>
              <p className="text-xs text-muted">{trip.departure_date} - {trip.status}</p>
            </div>
            <p className="text-emerald">{Number(trip.weight_available_kg).toFixed(1)} KG</p>
          </Card>
        ))}
        {trips.length === 0 && <Card>No trips yet.</Card>}
      </div>
    </section>
  );
}
