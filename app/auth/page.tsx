"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AuthCard } from "@/components/auth-card";

export default function AuthPage(): JSX.Element {
  const router = useRouter();

  return (
    <AppShell>
      <section className="mx-auto max-w-xl">
        <AuthCard onAuthenticated={() => router.push("/")} />
      </section>
    </AppShell>
  );
}
