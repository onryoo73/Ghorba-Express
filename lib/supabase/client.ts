import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && 
  supabaseAnonKey.length > 0 && 
  supabaseAnonKey !== "undefined" && 
  supabaseUrl !== "undefined";

if (typeof window !== "undefined" && !isSupabaseConfigured) {
  console.warn("Supabase is not correctly configured. Check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
}

export const supabase = (isSupabaseConfigured && typeof window !== "undefined")
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    })
  : null;
