"use client";

import { AppHeader } from "@/components/app-header";
import { useAuthSession } from "@/lib/use-auth-session";

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const { isAuthenticated, signOut } = useAuthSession();

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6 sm:max-w-2xl lg:max-w-5xl lg:px-8">
      <AppHeader isAuthenticated={isAuthenticated} onSignOut={signOut} />
      {children}
    </main>
  );
}
