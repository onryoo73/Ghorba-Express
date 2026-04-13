"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { adminEmail, supabase } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/supabase/types";

export function useAuthSession(): {
  isAuthenticated: boolean;
  isReady: boolean;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isAdmin: boolean;
  phoneVerified: boolean;
  signOut: () => Promise<void>;
} {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, phone_e164, phone_verified, is_admin, kyc_status")
      .eq("id", userId)
      .single();
    setProfile((data as Profile | null) ?? null);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      if (!supabase) {
        setIsReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        const currentUser = data.session?.user ?? null;
        setUser(currentUser);
        setIsAuthenticated(Boolean(currentUser));
        if (currentUser) {
          await loadProfile(currentUser.id);
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
        void loadProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setProfile(null);
  };

  const isAdmin = Boolean(profile?.is_admin) || user?.email?.toLowerCase() === adminEmail;
  const role = profile?.role ?? null;
  const phoneVerified = Boolean(profile?.phone_verified);

  return {
    isAuthenticated,
    isReady,
    user,
    profile,
    role,
    isAdmin,
    phoneVerified,
    signOut
  };
}
