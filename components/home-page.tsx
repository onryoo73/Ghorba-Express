"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Wallet2
} from "lucide-react";
import { OrderForm } from "@/components/order-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const travelers = [
  {
    name: "Sami B.",
    origin: "Paris",
    destination: "Tunis",
    date: "26 Apr 2026",
    kg: 7,
    rating: 4.9
  },
  {
    name: "Leila K.",
    origin: "Istanbul",
    destination: "Sfax",
    date: "29 Apr 2026",
    kg: 4,
    rating: 4.8
  },
  {
    name: "Youssef A.",
    origin: "Milan",
    destination: "Nabeul",
    date: "02 May 2026",
    kg: 9,
    rating: 5
  }
];

const timeline = [
  "Deposited",
  "Funds Locked",
  "In Transit",
  "Delivered",
  "Released"
];

export function HomePage(): JSX.Element {
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6 sm:max-w-2xl lg:max-w-5xl lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="space-y-4"
      >
        <Badge className="bg-emerald/20 text-emerald border-emerald/40">
          Tunisian P2P Shipping, escrow secured
        </Badge>
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
          CousinExpress
        </h1>
        <p className="text-sm text-muted sm:text-base">
          Find trusted travelers, lock funds safely, and track every package milestone.
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

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Available Travelers</h2>
          <Button variant="ghost" className="gap-1 px-1">
            View all <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {travelers.map((traveler, index) => (
            <motion.div
              key={traveler.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{traveler.name}</p>
                  <Badge className="gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-300" />
                    {traveler.rating}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-cardForeground">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-electricBlue" />
                    {traveler.origin} to {traveler.destination}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald" />
                    {traveler.date}
                  </p>
                  <p className="font-medium text-emerald">{traveler.kg} KG Available</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Wallet2 className="h-5 w-5 text-electricBlue" />
            <h3 className="text-lg font-semibold">Traveler Wallet</h3>
          </div>
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

        <OrderForm />
      </section>

      <section className="mt-8">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald" />
            <h3 className="text-lg font-semibold">Escrow Transaction Timeline</h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
    </main>
  );
}
