"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuthCard } from "@/components/auth-card";

export default function AuthPage(): JSX.Element {
  const router = useRouter();

  return (
    <AppShell>
      <section className="mx-auto max-w-xl">
        <h1 className="mb-2 text-2xl font-semibold">Welcome back</h1>
        <p className="mb-4 text-sm text-muted">
          Sign in to manage your shipments, wallet, and real-time delivery updates.
        </p>
        <AuthCard onAuthenticated={() => router.push("/")} />
      </section>
    </AppShell>
  );
}
