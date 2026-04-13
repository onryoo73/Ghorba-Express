"use client";

import { motion } from "framer-motion";
import { CalendarDays, MapPin, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const travelers = [
  { name: "Sami B.", origin: "Paris", destination: "Tunis", date: "26 Apr 2026", kg: 7, rating: 4.9 },
  { name: "Leila K.", origin: "Istanbul", destination: "Sfax", date: "29 Apr 2026", kg: 4, rating: 4.8 },
  { name: "Youssef A.", origin: "Milan", destination: "Nabeul", date: "02 May 2026", kg: 9, rating: 5 }
];

export default function TripsPage(): JSX.Element {
  return (
    <AppShell>
      <section>
        <h1 className="text-2xl font-semibold">Available Travelers</h1>
        <p className="mt-1 text-sm text-muted">Browse upcoming routes and reserved carrying capacity.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {travelers.map((traveler, index) => (
            <motion.div
              key={traveler.name}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
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
                <p className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-electricBlue" />
                  {traveler.origin} to {traveler.destination}
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-emerald" />
                  {traveler.date}
                </p>
                <p className="font-medium text-emerald">{traveler.kg} KG Available</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
