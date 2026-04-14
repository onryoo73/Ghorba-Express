"use client";

import { useState, useCallback } from "react";
import { AppHeader } from "@/components/app-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ToastContainer } from "@/components/toast-container";
import { useAuthSession } from "@/lib/use-auth-session";
import { useToast } from "@/lib/hooks/use-toast";
import { useMessageNotifications } from "@/lib/hooks/use-message-notifications";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const { isAuthenticated, role, effectiveRole, isAdmin, setActiveMode, signOut, user } = useAuthSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();
  const router = useRouter();

  // Listen for new messages and show notifications
  useMessageNotifications(user?.id, useCallback((threadId, senderName, message) => {
    showToast({
      type: "info",
      title: `New message from ${senderName}`,
      message: message.slice(0, 50) + (message.length > 50 ? "..." : "")
    });
  }, [showToast]));

  return (
    <main className="min-h-screen">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        isAuthenticated={isAuthenticated}
        role={role}
        effectiveRole={effectiveRole}
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
          effectiveRole={effectiveRole}
          isAdmin={isAdmin}
          onModeChange={setActiveMode}
          onSignOut={signOut}
        />
        {children}
        <MobileNav isAuthenticated={isAuthenticated} />
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
