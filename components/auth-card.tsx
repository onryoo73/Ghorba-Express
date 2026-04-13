"use client";

import { FormEvent, useMemo, useState } from "react";
import { KeyRound, LoaderCircle, PhoneCall, UserPlus } from "lucide-react";
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
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitLabel = useMemo(() => {
    if (isLoading) return "Please wait...";
    if (!otpSent) return "Send OTP";
    return mode === "login" ? "Verify and Log in" : "Verify and Create account";
  }, [isLoading, mode, otpSent]);

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
      if (!otpSent) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone,
          options: {
            shouldCreateUser: mode === "signup",
            data:
              mode === "signup"
                ? {
                    full_name: fullName,
                    role
                  }
                : undefined
          }
        });
        if (otpError) throw otpError;
        setOtpSent(true);
        setMessage("OTP sent. Enter the SMS code to continue.");
      } else {
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          phone,
          token: otpCode,
          type: "sms"
        });
        if (verifyError) throw verifyError;
        if (!verifyData.user) {
          throw new Error("Verification succeeded but no user session was returned.");
        }
        await supabase
          .from("profiles")
          .update({
            phone_e164: phone,
            phone_verified: true,
            full_name: mode === "signup" ? fullName : undefined,
            role: mode === "signup" ? role : undefined
          })
          .eq("id", verifyData.user.id);
        setMessage("Authenticated successfully.");
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
            <label className="block">
              <p className="mb-1 text-xs text-muted">Account role</p>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="h-11 w-full rounded-2xl border border-white/15 bg-white/5 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electricBlue"
              >
                <option value="buyer">Buyer</option>
                <option value="traveler">Traveler</option>
                <option value="both">Buyer + Traveler</option>
              </select>
            </label>
          </>
        )}

        <div className="relative">
          <PhoneCall className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
          <Input
            className="pl-10"
            placeholder="+216XXXXXXXX"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </div>

        {otpSent && (
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
            <Input
              className="pl-10"
              placeholder="6-digit OTP code"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              required
            />
          </div>
        )}

        {error && <p className="text-sm text-red-300">{error}</p>}
        {message && <p className="text-sm text-emerald">{message}</p>}

        <Button className="w-full gap-2" disabled={isLoading}>
          {isLoading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <PhoneCall className="h-4 w-4" />
          )}
          {submitLabel}
        </Button>
        {otpSent && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setOtpSent(false);
              setOtpCode("");
              setMessage(null);
              setError(null);
            }}
          >
            Edit phone number
          </Button>
        )}
      </form>
    </Card>
  );
}
