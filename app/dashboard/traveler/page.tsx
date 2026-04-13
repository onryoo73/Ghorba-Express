"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DashboardGuard } from "@/components/guards/dashboard-guard";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat-panel";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authedJsonFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase/client";

interface OrderRow {
  id: string;
  origin: string;
  destination: string;
  status: string;
}

interface TripRow {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  weight_available_kg: number;
  status: string;
}

export default function TravelerDashboardPage(): JSX.Element {
  const [openOrders, setOpenOrders] = useState<OrderRow[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<OrderRow[]>([]);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [tripOrigin, setTripOrigin] = useState("");
  const [tripDestination, setTripDestination] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [tripWeight, setTripWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const [openResult, assignedResult] = await Promise.all([
        authedJsonFetch<{ orders: OrderRow[] }>("/api/orders?scope=open"),
        authedJsonFetch<{ orders: OrderRow[] }>("/api/orders?scope=assigned")
      ]);
      setOpenOrders(openResult.orders);
      setAssignedOrders(assignedResult.orders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load traveler orders.");
    }
  };

  const loadTrips = async () => {
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: tripError } = await supabase
      .from("trips")
      .select("id, origin, destination, departure_date, weight_available_kg, status")
      .eq("traveler_id", user.id)
      .order("departure_date", { ascending: true });
    if (tripError) {
      setError(tripError.message);
      return;
    }
    setTrips((data as TripRow[] | null) ?? []);
  };

  useEffect(() => {
    void loadOrders();
    void loadTrips();
  }, []);

  const createTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      return;
    }

    const { error: insertError } = await supabase.from("trips").insert({
      traveler_id: user.id,
      origin: tripOrigin,
      destination: tripDestination,
      departure_date: tripDate,
      weight_available_kg: Number(tripWeight),
      status: "open"
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTripOrigin("");
    setTripDestination("");
    setTripDate("");
    setTripWeight("");
    await loadTrips();
  };

  const closeTrip = async (tripId: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("trips")
      .update({ status: "cancelled" })
      .eq("id", tripId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadTrips();
  };

  const acceptOrder = async (orderId: string) => {
    try {
      await authedJsonFetch("/api/orders/accept", {
        method: "POST",
        body: JSON.stringify({ orderId })
      });
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept order.");
    }
  };

  const markInTransit = async (orderId: string) => {
    try {
      await authedJsonFetch("/api/orders/mark-in-transit", {
        method: "POST",
        body: JSON.stringify({ orderId })
      });
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark in transit.");
    }
  };

  return (
    <AppShell>
      <DashboardGuard allowedRoles={["traveler", "both"]}>
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Traveler Dashboard</h1>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="space-y-3">
              <h2 className="font-medium">Create Trip</h2>
              <form className="space-y-2" onSubmit={(event) => void createTrip(event)}>
                <Input
                  placeholder="Origin city"
                  value={tripOrigin}
                  onChange={(event) => setTripOrigin(event.target.value)}
                  required
                />
                <Input
                  placeholder="Destination city"
                  value={tripDestination}
                  onChange={(event) => setTripDestination(event.target.value)}
                  required
                />
                <Input
                  type="date"
                  value={tripDate}
                  onChange={(event) => setTripDate(event.target.value)}
                  required
                />
                <Input
                  placeholder="Available weight (KG)"
                  type="number"
                  min="1"
                  value={tripWeight}
                  onChange={(event) => setTripWeight(event.target.value)}
                  required
                />
                <Button className="w-full">Publish Trip</Button>
              </form>
            </Card>

            <Card className="space-y-2">
              <h2 className="font-medium">My Trips</h2>
              {trips.map((trip) => (
                <div key={trip.id} className="rounded-xl border border-white/10 p-3">
                  <p className="text-sm">
                    {trip.origin} to {trip.destination}
                  </p>
                  <p className="text-xs text-muted">
                    {trip.departure_date} - {trip.weight_available_kg} KG - {trip.status}
                  </p>
                  {trip.status === "open" && (
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={() => void closeTrip(trip.id)}
                    >
                      Close Trip
                    </Button>
                  )}
                </div>
              ))}
              {trips.length === 0 && <p className="text-sm text-muted">No trips published yet.</p>}
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="space-y-2">
              <h2 className="font-medium">Open Orders</h2>
              {openOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-white/10 p-3">
                  <p className="text-xs text-muted">Order ID: {order.id}</p>
                  <p className="text-sm">
                    {order.origin} to {order.destination}
                  </p>
                  <Button className="mt-2" onClick={() => void acceptOrder(order.id)}>
                    Accept Order
                  </Button>
                </div>
              ))}
              {openOrders.length === 0 && <p className="text-sm text-muted">No open orders available.</p>}
            </Card>

            <Card className="space-y-2">
              <h2 className="font-medium">My Assigned Orders</h2>
              {assignedOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-white/10 p-3">
                  <p className="text-xs text-muted">Order ID: {order.id}</p>
                  <p className="text-sm">
                    {order.origin} to {order.destination} ({order.status})
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-2"
                    onClick={() => setActiveChatOrderId(order.id)}
                  >
                    Open Chat
                  </Button>
                  {order.status === "accepted" && (
                    <Button variant="secondary" className="mt-2" onClick={() => void markInTransit(order.id)}>
                      Mark In Transit
                    </Button>
                  )}
                  <p className="mt-2 text-xs text-electricBlue">
                    Ask buyer to confirm delivery with QR token once received.
                  </p>
                </div>
              ))}
              {assignedOrders.length === 0 && <p className="text-sm text-muted">No accepted orders yet.</p>}
            </Card>
          </div>
          {activeChatOrderId && <ChatPanel orderId={activeChatOrderId} />}
        </section>
      </DashboardGuard>
    </AppShell>
  );
}
