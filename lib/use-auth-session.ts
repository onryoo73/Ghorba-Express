"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { adminEmail, supabase } from "@/lib/supabase/client";
import type { DashboardMode, Profile, UserRole } from "@/lib/supabase/types";

export function useAuthSession(): {
  isAuthenticated: boolean;
  isReady: boolean;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  effectiveRole: DashboardMode | null;
  activeMode: DashboardMode | null;
  setActiveMode: (mode: DashboardMode) => void;
  isAdmin: boolean;
  signOut: () => Promise<void>;
} {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeMode, setActiveModeState] = useState<DashboardMode | null>(null);
  const role = profile?.role ?? null;

  const ensureProfile = async (authUser: User) => {
    if (!supabase) return;
    const fallbackName =
      (authUser.user_metadata?.full_name as string | undefined) ??
      authUser.email?.split("@")[0] ??
      "User";
    const fallbackRole =
      (authUser.user_metadata?.role as UserRole | undefined) ?? "buyer";

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("id", authUser.id)
      .maybeSingle();

    if (data) {
      if (data.role === "buyer" && fallbackRole !== "buyer") {
        const { data: updatedData } = await supabase
          .from("profiles")
          .update({ role: fallbackRole })
          .eq("id", authUser.id)
          .select("id, full_name, phone, role")
          .maybeSingle();
        setProfile((updatedData as Profile | null) ?? (data as Profile));
        return;
      }
      setProfile(data as Profile);
      return;
    }

    await supabase.from("profiles").insert({
      id: authUser.id,
      full_name: fallbackName,
      role: fallbackRole
    });

    const { data: insertedData } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("id", authUser.id)
      .maybeSingle();
    setProfile((insertedData as Profile | null) ?? null);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      if (!supabase || typeof window === "undefined") {
        setIsReady(true);
        return;
      }

      // Check for current session explicitly
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session init error:", error);
        setIsReady(true);
        return;
      }

      if (isMounted) {
        const currentUser = data.session?.user ?? null;
        console.log("Session init user:", currentUser?.email);
        setUser(currentUser);
        setIsAuthenticated(Boolean(currentUser));
        if (currentUser) {
          await ensureProfile(currentUser);
        }
        setIsReady(true);
      }
    };

    void initializeSession();

    if (!supabase) {
      return () => {
        isMounted = false;
      };
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      setIsAuthenticated(Boolean(sessionUser));
      if (sessionUser) {
        void ensureProfile(sessionUser);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !role) return;
    const key = `dashboard_mode_${user.id}`;

    if (role === "both") {
      const stored = localStorage.getItem(key);
      if (stored === "buyer" || stored === "traveler") {
        setActiveModeState(stored);
      } else {
        setActiveModeState("buyer");
      }
      return;
    }

    setActiveModeState(role === "traveler" ? "traveler" : "buyer");
  }, [role, user]);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setProfile(null);
  };

  const effectiveRole: DashboardMode | null =
    role === "both" ? activeMode ?? "buyer" : role === "traveler" ? "traveler" : role === "buyer" ? "buyer" : null;
  const isAdmin = user?.email?.toLowerCase() === adminEmail;
  const setActiveMode = (mode: DashboardMode) => {
    if (!user || role !== "both") return;
    setActiveModeState(mode);
    localStorage.setItem(`dashboard_mode_${user.id}`, mode);
  };

  return {
    isAuthenticated,
    isReady,
    user,
    profile,
    role,
    effectiveRole,
    activeMode,
    setActiveMode,
    isAdmin,
    signOut
  };
}
