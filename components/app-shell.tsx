"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { useAuthSession } from "@/lib/use-auth-session";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const { isAuthenticated, role, isAdmin, signOut } = useAuthSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <main className="min-h-screen">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        isAuthenticated={isAuthenticated}
        role={role}
        isAdmin={isAdmin}
      />
      <div
        className={cn(
          "mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-6 sm:max-w-2xl lg:max-w-none lg:px-8 lg:pb-10",
          sidebarOpen ? "lg:pl-[18rem]" : "lg:pl-24"
        )}
      >
        <AppHeader
          isAuthenticated={isAuthenticated}
          role={role}
          isAdmin={isAdmin}
          onSignOut={signOut}
        />
        {children}
        <MobileNav isAuthenticated={isAuthenticated} />
      </div>
    </main>
  );
}
