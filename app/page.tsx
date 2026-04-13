"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Handshake,
  PackageCheck,
  Search,
  ShieldCheck,
  Star
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const safetyPills = ["Escrow Protected", "ID Verified Travelers", "Proof Required", "Dispute Support"];

const featuredTrips = [
  { name: "Sami B.", route: "Paris to Tunis", date: "26 Apr", kg: "7 KG", rating: 4.9 },
  { name: "Leila K.", route: "Istanbul to Sfax", date: "29 Apr", kg: "4 KG", rating: 4.8 },
  { name: "Youssef A.", route: "Milan to Nabeul", date: "02 May", kg: "9 KG", rating: 5.0 }
];

const steps = [
  { title: "Post your request", text: "Choose Buy & Bring or Pickup & Bring with your reward." },
  { title: "Traveler accepts", text: "Verified traveler locks the deal with escrow protection." },
  { title: "Delivery confirmed", text: "QR handoff confirms delivery and funds get released." }
];

const faqs = [
  {
    q: "How is my payment protected?",
    a: "Funds are deposited first, then locked in escrow until successful delivery confirmation."
  },
  {
    q: "What proof is required?",
    a: "You can upload D17 or Flouci screenshot proof during order creation."
  },
  {
    q: "What happens if something goes wrong?",
    a: "A dispute process can freeze release while support verifies package and payment logs."
  }
];

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
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <p className="text-xs text-muted">Active Trips</p>
            <p className="mt-1 text-lg font-semibold text-electricBlue">84</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted">Escrow Safe</p>
            <p className="mt-1 text-lg font-semibold text-emerald">100%</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted">Avg Delivery</p>
            <p className="mt-1 text-lg font-semibold">3.1 days</p>
          </Card>
        </div>
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
          <Link href="/trips" className="inline-flex items-center text-sm text-electricBlue">
            Explore all travelers <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Card>
      </motion.section>

      <section className="mt-7">
        <h2 className="mb-3 text-lg font-semibold">Trust & Safety</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {safetyPills.map((pill) => (
            <Badge key={pill} className="justify-center border-white/20 bg-white/10 py-2 text-center">
              {pill}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">How It Works</h2>
          <Badge className="border-electricBlue/40 bg-electricBlue/20 text-electricBlue">Simple 3-step flow</Badge>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-electricBlue/20 text-sm font-semibold text-electricBlue">
                {index + 1}
              </div>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted">{step.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Featured Live Trips</h2>
          <Link href="/trips" className="inline-flex items-center text-sm text-electricBlue">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {featuredTrips.map((trip) => (
            <Card key={trip.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{trip.name}</p>
                <Badge className="gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-300" />
                  {trip.rating}
                </Badge>
              </div>
              <p className="text-sm">{trip.route}</p>
              <div className="flex items-center justify-between text-sm text-muted">
                <p>{trip.date}</p>
                <p className="text-emerald">{trip.kg} available</p>
              </div>
              <Button className="w-full">Book Spot</Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 text-lg font-semibold">Platform Highlights</h2>
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3 text-center">
            <p className="text-xs text-muted">Deliveries Done</p>
            <p className="mt-1 text-lg font-semibold text-electricBlue">2,340+</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted">Success Rate</p>
            <p className="mt-1 text-lg font-semibold text-emerald">98.7%</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted">Average Delivery</p>
            <p className="mt-1 text-lg font-semibold">3.2 days</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-muted">User Rating</p>
            <p className="mt-1 text-lg font-semibold">4.9/5</p>
          </Card>
        </div>
      </section>

      <section className="mt-7">
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald" />
            <h2 className="text-lg font-semibold">Escrow Timeline</h2>
          </div>
          <div className="space-y-2">
            {["Deposited", "Funds Locked", "In Transit", "Delivered", "Released"].map((item, index) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className={`h-4 w-4 ${index < 3 ? "text-emerald" : "text-white/35"}`} />
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 text-lg font-semibold">Community Stories</h2>
        <div className="space-y-3">
          <Card>
            <p className="text-sm">
              "I received my laptop charger from Istanbul in 3 days. Smooth payment, smooth handoff."
            </p>
            <p className="mt-2 text-xs text-muted">- Ines, Tunis</p>
          </Card>
          <Card>
            <p className="text-sm">
              "The QR confirmation and locked funds made me feel safe as a traveler."
            </p>
            <p className="mt-2 text-xs text-muted">- Hamza, Sfax</p>
          </Card>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="mb-3 text-lg font-semibold">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((item) => (
            <Card key={item.q}>
              <p className="flex items-start gap-2 text-sm font-medium">
                <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-electricBlue" />
                {item.q}
              </p>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <Card className="space-y-3 border-electricBlue/35 bg-electricBlue/10">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-electricBlue" />
            <h2 className="text-lg font-semibold">Ready to ship smarter?</h2>
          </div>
          <p className="text-sm text-cardForeground">
            Start your first order today or become a traveler and earn from free luggage space.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/orders">
              <Button className="w-full">I am a Buyer</Button>
            </Link>
            <Link href="/trips">
              <Button variant="secondary" className="w-full gap-1">
                I am a Traveler <Handshake className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
