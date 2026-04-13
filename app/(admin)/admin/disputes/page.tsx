"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

interface Dispute {
  id: string;
  order_id: string;
  reason: string;
  status: "open" | "investigating" | "resolved" | "rejected";
  resolution: string | null;
}

export default function AdminDisputesPage(): JSX.Element {
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  const loadDisputes = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("disputes")
      .select("id,order_id,reason,status,resolution")
      .order("created_at", { ascending: false });
    setDisputes((data as Dispute[] | null) ?? []);
  };

  useEffect(() => {
    void loadDisputes();
  }, []);

  const setStatus = async (id: string, status: Dispute["status"]) => {
    if (!supabase) return;
    await supabase.from("disputes").update({ status }).eq("id", id);
    await loadDisputes();
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard - Disputes</h1>
      <p className="text-sm text-muted">Investigate disputes and control escrow release actions.</p>
      <div className="space-y-2">
        {disputes.map((dispute) => (
          <Card key={dispute.id} className="space-y-2">
            <p className="text-xs text-muted">Order: {dispute.order_id}</p>
            <p className="font-medium">{dispute.reason}</p>
            <p className="text-sm">Status: {dispute.status}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void setStatus(dispute.id, "investigating")}>
                Mark Investigating
              </Button>
              <Button variant="secondary" onClick={() => void setStatus(dispute.id, "resolved")}>
                Resolve
              </Button>
              <Button variant="secondary" onClick={() => void setStatus(dispute.id, "rejected")}>
                Reject
              </Button>
            </div>
          </Card>
        ))}
        {disputes.length === 0 && <Card>No disputes yet.</Card>}
      </div>
    </section>
  );
}
