import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OrderForm } from "@/components/order-form";
import { Card } from "@/components/ui/card";

const timeline = ["Deposited", "Funds Locked", "In Transit", "Delivered", "Released"];

export default function OrdersPage(): JSX.Element {
  return (
    <AppShell>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-semibold">Create and Track Orders</h1>
          <p className="mt-1 text-sm text-muted">
            Submit payment proof, generate handoff QR, and monitor escrow state in one place.
          </p>
        </div>
        <OrderForm />
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald" />
            <h2 className="text-lg font-semibold">Escrow Transaction Timeline</h2>
          </div>
          <div className="flex flex-col gap-3">
            {timeline.map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    index < 3 ? "bg-emerald shadow-[0_0_14px_rgba(47,204,154,0.9)]" : "bg-white/20"
                  }`}
                />
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
