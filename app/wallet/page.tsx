"use client";

import { useEffect, useState } from "react";
import { Wallet2, Clock, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authedJsonFetch } from "@/lib/api-client";

interface Transaction {
  id: string;
  amount: number;
  type: "deposit" | "withdrawal" | "payment" | "earning" | "refund";
  description: string;
  created_at: string;
}

interface WalletStats {
  available: number;
  locked: number;
  transactions: Transaction[];
}

export default function WalletPage(): JSX.Element {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await authedJsonFetch<WalletStats>("/api/wallet/stats");
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch wallet stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-electricBlue" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Wallet2 className="h-5 w-5 text-electricBlue" />
          <h1 className="text-2xl font-semibold">Escrow Wallet</h1>
        </div>

        <p className="text-sm text-muted">
          Your locked funds stay protected until delivery confirmation is complete.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-electricBlue/5 border-electricBlue/20">
            <p className="text-xs text-muted mb-1">Pending / Locked Balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-electricBlue">
                {(() => {
                  const val = stats?.locked;
                  return (typeof val === 'number' && !isNaN(val)) ? val.toLocaleString() : "0";
                })()}
              </p>
              <span className="text-sm font-medium text-electricBlue/60">TND</span>
            </div>
            <p className="mt-2 text-[10px] text-muted flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updates automatically on delivery
            </p>
          </Card>

          <Card className="bg-emerald/5 border-emerald/20">
            <p className="text-xs text-muted mb-1">Available Balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-emerald">
                {(() => {
                  const val = stats?.available;
                  return (typeof val === 'number' && !isNaN(val)) ? val.toLocaleString() : "0";
                })()}
              </p>
              <span className="text-sm font-medium text-emerald/60">TND</span>
            </div>
            <Button variant="secondary" className="mt-4 w-full h-8 text-xs">
              Withdraw Available Funds
            </Button>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Card className="p-0 overflow-hidden">
            {stats?.transactions && stats.transactions.length > 0 ? (
              <div className="divide-y divide-white/10">
                {stats.transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        t.type === 'earning' || t.type === 'deposit' || t.type === 'refund' 
                        ? 'bg-emerald/10 text-emerald' 
                        : 'bg-rose-400/10 text-rose-400'
                      }`}>
                        {t.type === 'earning' || t.type === 'deposit' || t.type === 'refund' 
                          ? <ArrowDownLeft className="h-4 w-4" /> 
                          : <ArrowUpRight className="h-4 w-4" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-[10px] text-muted">{new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${
                      t.type === 'earning' || t.type === 'deposit' || t.type === 'refund'
                      ? 'text-emerald'
                      : 'text-rose-400'
                    }`}>
                      {t.type === 'earning' || t.type === 'deposit' || t.type === 'refund' ? '+' : '-'}
                      {(typeof t.amount === 'number' && !isNaN(t.amount)) ? t.amount.toLocaleString() : "0"} TND
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted text-sm italic">
                No transactions yet.
              </div>
            )}
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
