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
  signOut: () => Promise<void>;
} {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

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

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setProfile(null);
  };

  const role = profile?.role ?? null;
  const isAdmin = user?.email?.toLowerCase() === adminEmail;

  return { isAuthenticated, isReady, user, profile, role, isAdmin, signOut };
}
