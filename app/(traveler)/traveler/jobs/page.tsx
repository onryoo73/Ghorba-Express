"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

interface TravelerJob {
  id: string;
  origin: string;
  destination: string;
  status: string;
  delivery_qr_token: string;
}

export default function TravelerJobsPage(): JSX.Element {
  const [jobs, setJobs] = useState<TravelerJob[]>([]);

  const loadJobs = async () => {
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("orders")
      .select("id,origin,destination,status,delivery_qr_token")
      .eq("traveler_id", user.id)
      .in("status", ["accepted", "in_transit", "delivered"])
      .order("created_at", { ascending: false });

    setJobs((data as TravelerJob[] | null) ?? []);
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const markDelivered = async (orderId: string) => {
    if (!supabase) return;
    await supabase
      .from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", orderId);
    await loadJobs();
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Traveler Dashboard - Accepted Jobs</h1>
      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">{job.origin} to {job.destination}</p>
              <p className="text-xs uppercase text-muted">{job.status}</p>
            </div>
            <p className="text-xs text-electricBlue">Delivery QR Token: {job.delivery_qr_token}</p>
            {job.status !== "delivered" && (
              <Button variant="secondary" onClick={() => void markDelivered(job.id)}>
                Confirm Delivery
              </Button>
            )}
          </Card>
        ))}
        {jobs.length === 0 && <Card>No active jobs.</Card>}
      </div>
    </section>
  );
}
