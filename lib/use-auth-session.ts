"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useAuthSession(): {
  isAuthenticated: boolean;
  isReady: boolean;
  signOut: () => Promise<void>;
} {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      if (!supabase) {
        setIsReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setIsAuthenticated(Boolean(data.session));
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
      setIsAuthenticated(Boolean(session));
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
  };

  return { isAuthenticated, isReady, signOut };
}
