import type { NextRequest } from "next/server";
import { getServiceSupabase, getUserSupabase } from "@/lib/server/supabase";

export async function getAuthedUser(request: NextRequest) {
  const userClient = getUserSupabase(request);
  if (!userClient) return null;
  const {
    data: { user }
  } = await userClient.auth.getUser();
  return user ?? null;
}

export async function getAuthedProfile(request: NextRequest) {
  const user = await getAuthedUser(request);
  if (!user) return null;

  const service = getServiceSupabase();
  const { data } = await service
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  return data ? { user, profile: data } : null;
}

export async function requireAdmin(request: NextRequest) {
  console.log("[requireAdmin] Starting check...");
  const user = await getAuthedUser(request);
  console.log("[requireAdmin] User:", user?.email);
  if (!user) {
    console.log("[requireAdmin] No user - returning null");
    return null;
  }
  
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();
  console.log("[requireAdmin] Admin email env:", adminEmail);
  console.log("[requireAdmin] User email:", user.email?.toLowerCase());
  
  if (user.email?.toLowerCase() === adminEmail) {
    console.log("[requireAdmin] Admin email match!");
    return user;
  }

  const service = getServiceSupabase();
  console.log("[requireAdmin] Checking profiles table for role...");
  const { data } = await service
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .eq("role", "both")
    .maybeSingle();

  console.log("[requireAdmin] Profile result:", data);
  return data ? user : null;
}
