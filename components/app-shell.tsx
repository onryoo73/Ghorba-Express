"use client";

import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";
import { useAuthSession } from "@/lib/use-auth-session";

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const { isAuthenticated, role, isAdmin, signOut } = useAuthSession();

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-6 sm:max-w-2xl lg:max-w-5xl lg:px-8 lg:pb-10">
      <AppHeader
        isAuthenticated={isAuthenticated}
        role={role}
        isAdmin={isAdmin}
        onSignOut={signOut}
      />
      {children}
      <MobileNav isAuthenticated={isAuthenticated} />
    </main>
  );
}
