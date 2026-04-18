"use client";

import { useState } from "react";
import { Camera, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";

export function OrderForm(): JSX.Element {
  const [tab, setTab] = useState<"buy" | "pickup">("buy");

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted">Create Order</p>
          <h3 className="text-lg font-semibold">Multi-Type Buyer Request</h3>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as "buy" | "pickup")}
          options={[
            { label: "Buy & Bring", value: "buy" },
            { label: "Pickup & Bring", value: "pickup" }
          ]}
        />

        <div className="space-y-3">
          {tab === "buy" && (
            <Input placeholder="Product Price (TND)" type="number" min="0" />
          )}
          <Input placeholder="Traveler Reward (TND)" type="number" min="0" />
          <Input placeholder="Item details (size, fragility, notes)" />
        </div>

        <Button variant="secondary" className="w-full gap-2">
          <Camera className="h-4 w-4" />
          Upload Proof of Payment (D17 / Flouci)
        </Button>

        <div className="rounded-2xl border border-dashed border-border bg-surface p-4 text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-hover">
            <QrCode className="h-7 w-7 text-electricBlue" />
          </div>
          <p className="text-sm font-medium">Delivery Confirmation QR</p>
          <p className="text-xs text-muted">Placeholder: generate secure QR at handoff.</p>
        </div>
      </div>
    </Card>
  );
}
