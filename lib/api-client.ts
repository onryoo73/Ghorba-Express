"use client";

import { supabase } from "@/lib/supabase/client";

export async function authedJsonFetch<TResponse>(
  input: string,
  init?: RequestInit
): Promise<TResponse> {
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No active session. Please log in.");
  }

  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(init?.headers ?? {})
    }
  });

  const json = (await response.json()) as { error?: string } & TResponse;

  if (!response.ok) {
    throw new Error(json.error ?? "Request failed");
  }

  return json as TResponse;
}
