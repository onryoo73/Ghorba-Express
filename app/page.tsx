"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Page(): JSX.Element {
  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <Badge className="border-emerald/40 bg-emerald/20 text-emerald">
          Tunisian P2P Shipping, escrow secured
        </Badge>
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
          CousinExpress
        </h1>
        <p className="text-sm text-muted sm:text-base">
          Find trusted travelers, lock funds safely, and track each delivery milestone.
        </p>
        <Card className="space-y-3">
          <h2 className="text-base font-semibold">Where is your package?</h2>
          <div className="grid gap-3">
            <Input placeholder="From (city or airport)" />
            <Input placeholder="To (city or airport)" />
            <Input type="date" />
          </div>
          <Button className="w-full gap-2">
            <Search className="h-4 w-4" />
            Search Trips
          </Button>
        </Card>
      </motion.section>
    </AppShell>
  );
}
