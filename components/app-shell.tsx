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
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const { isAuthenticated, role, effectiveRole, isAdmin, setActiveMode, signOut, user, isReady } = useAuthSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, showToast, dismissToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect admin users to admin dashboard if they try to access non-admin pages
  useEffect(() => {
    if (isReady && isAuthenticated && isAdmin) {
      const allowedAdminPaths = ["/dashboard/admin", "/profile", "/auth"];
      const isAllowedPath = allowedAdminPaths.some(path => pathname === path || pathname.startsWith("/dashboard/admin/"));
      
      if (!isAllowedPath) {
        console.log("[Admin] Redirecting to admin dashboard from:", pathname);
        router.push("/dashboard/admin");
      }
    }
  }, [isReady, isAuthenticated, isAdmin, pathname, router]);

  // Listen for new messages and show notifications
  useMessageNotifications(user?.id, useCallback((threadId, senderName, message) => {
    // Admins don't participate in chats, so we skip notifications for them
    if (isAdmin) return;
    
    showToast({
      type: "info",
      title: `New message from ${senderName}`,
      message: message.slice(0, 50) + (message.length > 50 ? "..." : "")
    });
  }, [showToast, isAdmin]));

  return (
    <main className="min-h-screen">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        isAuthenticated={isAuthenticated}
        role={role}
        effectiveRole={effectiveRole}
        isAdmin={isAdmin}
        userId={user?.id}
        userName={user?.user_metadata?.full_name}
        userAvatar={user?.user_metadata?.avatar_url}
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
          userId={user?.id}
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
