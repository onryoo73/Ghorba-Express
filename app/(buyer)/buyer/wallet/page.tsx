"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

interface EscrowRow {
  id: string;
  amount_tnd: number;
  status: string;
  created_at: string;
}

export default function BuyerWalletPage(): JSX.Element {
  const [rows, setRows] = useState<EscrowRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEscrowRows = async () => {
      if (!supabase) return;
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("escrow_transactions")
        .select("id,amount_tnd,status,created_at,payer_id")
        .eq("payer_id", user.id)
        .order("created_at", { ascending: false });

      setRows((data as EscrowRow[] | null) ?? []);
      setLoading(false);
    };
    void loadEscrowRows();
  }, []);

  const totalLocked = rows
    .filter((row) => ["deposited", "funds_locked", "in_transit", "delivered"].includes(row.status))
    .reduce((sum, row) => sum + Number(row.amount_tnd), 0);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Buyer Dashboard - Wallet</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs text-muted">Locked Escrow</p>
          <p className="mt-1 text-2xl font-semibold text-electricBlue">{totalLocked.toFixed(2)} TND</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Transactions</p>
          <p className="mt-1 text-2xl font-semibold">{rows.length}</p>
        </Card>
      </div>
      {loading ? (
        <Card>Loading wallet...</Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <Card key={row.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{row.status}</p>
                <p className="text-xs text-muted">{new Date(row.created_at).toLocaleString()}</p>
              </div>
              <p className="font-semibold">{Number(row.amount_tnd).toFixed(2)} TND</p>
            </Card>
          ))}
          {rows.length === 0 && <Card>No wallet records yet.</Card>}
        </div>
      )}
    </section>
  );
}
