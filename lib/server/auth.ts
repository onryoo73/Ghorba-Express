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
  const user = await getAuthedUser(request);
  if (!user) return null;
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();
  if (user.email?.toLowerCase() === adminEmail) return user;

  const service = getServiceSupabase();
  const { data } = await service
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .eq("role", "both")
    .maybeSingle();

  return data ? user : null;
}
