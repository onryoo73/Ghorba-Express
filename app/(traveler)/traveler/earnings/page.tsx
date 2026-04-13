"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

interface EscrowRow {
  id: string;
  amount_tnd: number;
  status: string;
}

interface WithdrawRequest {
  id: string;
  amount_tnd: number;
  status: string;
  created_at: string;
}

export default function TravelerEarningsPage(): JSX.Element {
  const [locked, setLocked] = useState(0);
  const [available, setAvailable] = useState(0);
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [amount, setAmount] = useState("");

  const loadEarnings = async () => {
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: escrowData } = await supabase
      .from("escrow_transactions")
      .select("id,amount_tnd,status")
      .eq("payee_id", user.id);
    const rows = (escrowData as EscrowRow[] | null) ?? [];
    const lockedTotal = rows
      .filter((row) => ["funds_locked", "in_transit", "delivered"].includes(row.status))
      .reduce((sum, row) => sum + Number(row.amount_tnd), 0);
    const availableTotal = rows
      .filter((row) => row.status === "released")
      .reduce((sum, row) => sum + Number(row.amount_tnd), 0);

    setLocked(lockedTotal);
    setAvailable(availableTotal);

    const { data: withdrawData } = await supabase
      .from("withdraw_requests")
      .select("id,amount_tnd,status,created_at")
      .eq("traveler_id", user.id)
      .order("created_at", { ascending: false });
    setWithdraws((withdrawData as WithdrawRequest[] | null) ?? []);
  };

  useEffect(() => {
    void loadEarnings();
  }, []);

  const requestWithdraw = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("withdraw_requests").insert({
      traveler_id: user.id,
      amount_tnd: Number(amount)
    });
    setAmount("");
    await loadEarnings();
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Traveler Dashboard - Earnings</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs text-muted">Locked Balance</p>
          <p className="mt-1 text-2xl font-semibold text-electricBlue">{locked.toFixed(2)} TND</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Available Balance</p>
          <p className="mt-1 text-2xl font-semibold text-emerald">{available.toFixed(2)} TND</p>
        </Card>
      </div>
      <Card>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => void requestWithdraw(event)}>
          <Input
            placeholder="Withdraw amount (TND)"
            type="number"
            min="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
          <Button>Request Withdrawal</Button>
        </form>
      </Card>
      <div className="space-y-2">
        {withdraws.map((item) => (
          <Card key={item.id} className="flex items-center justify-between">
            <p>{Number(item.amount_tnd).toFixed(2)} TND</p>
            <p className="text-xs uppercase text-muted">{item.status}</p>
          </Card>
        ))}
        {withdraws.length === 0 && <Card>No withdraw requests yet.</Card>}
      </div>
    </section>
  );
}
