"use client";

import { FormEvent, useMemo, useState } from "react";
import { LoaderCircle, LogIn, Mail, Phone, UserPlus } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import type { UserRole } from "@/lib/supabase/types";

type AuthMode = "login" | "signup";

interface AuthCardProps {
  onAuthenticated?: () => void;
}

export function AuthCard({ onAuthenticated }: AuthCardProps): JSX.Element {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitLabel = useMemo(() => {
    if (isLoading) return "Please wait...";
    return mode === "login" ? "Log in" : "Create account";
  }, [isLoading, mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
      );
      return;
    }

    try {
      setIsLoading(true);
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        setMessage("Logged in successfully.");
        onAuthenticated?.();
      } else {
        // Simplified signup - no email confirmation
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });
        if (signUpError) throw signUpError;
        
        // Auto sign in after signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        
        const userId = signInData.user?.id || signUpData.user?.id;
        if (!userId) {
          throw new Error("Could not get user id after signup.");
        }

        // Create profile with selected role
        const { error: profileError } = await supabase.from("profiles").insert({
          id: userId,
          full_name: fullName,
          phone: phone || null,
          role
        });
        
        // Ignore profile error if it already exists
        if (profileError && !profileError.message.includes("duplicate")) {
          console.warn("Profile creation warning:", profileError);
        }

        setMessage("Account created! Welcome aboard.");
        onAuthenticated?.();
      }
    } catch (authError) {
      const safeMessage =
        authError instanceof Error ? authError.message : "Authentication failed.";
      setError(safeMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-electricBlue/30">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-muted">Secure access</p>
          <h3 className="text-lg font-semibold">Login / Sign up</h3>
        </div>
      </div>

      <Tabs
        value={mode}
        onValueChange={(value) => setMode(value as AuthMode)}
        options={[
          { label: "Log in", value: "login" },
          { label: "Sign up", value: "signup" }
        ]}
        className="mb-4"
      />

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
        {mode === "signup" && (
          <>
            <div className="relative">
              <UserPlus className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
              <Input
                className="pl-10"
                placeholder="Full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
              <Input
                className="pl-10"
                placeholder="Phone number (optional)"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <label className="block">
              <p className="mb-1 text-xs text-muted">Role for testing</p>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electricBlue"
              >
                <option value="buyer">Buyer</option>
                <option value="traveler">Traveler</option>
                <option value="both">Buyer + Traveler</option>
              </select>
            </label>
          </>
        )}

        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
          <Input
            className="pl-10"
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
        />

        {error && <p className="text-sm text-red-500 dark:text-red-300">{error}</p>}
        {message && <p className="text-sm text-emerald">{message}</p>}

        <Button className="w-full gap-2" disabled={isLoading}>
          {isLoading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : mode === "login" ? (
            <LogIn className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {submitLabel}
        </Button>
      </form>
    </Card>
  );
}
