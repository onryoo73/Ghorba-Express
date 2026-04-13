import { Wallet2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WalletPage(): JSX.Element {
  return (
    <AppShell>
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Wallet2 className="h-5 w-5 text-electricBlue" />
          <h1 className="text-2xl font-semibold">Escrow Wallet</h1>
        </div>
        <p className="mb-4 text-sm text-muted">
          Your locked funds stay protected until delivery confirmation is complete.
        </p>
        <Card className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-xs text-muted">Pending / Locked Balance</p>
              <p className="mt-1 text-2xl font-semibold text-electricBlue">1,280 TND</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-xs text-muted">Available Balance</p>
              <p className="mt-1 text-2xl font-semibold text-emerald">340 TND</p>
            </div>
          </div>
          <Button variant="secondary">Withdraw Available Funds</Button>
        </Card>
      </section>
    </AppShell>
  );
}
