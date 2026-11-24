import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 1. Define a private variable to hold the single instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Singleton getter for the browser-safe Supabase client (anon key).
 * Ensures only ONE instance exists, preventing "Multiple GoTrueClient" warnings.
 *
 * This client is subject to Row Level Security — it must never be used for
 * anything that needs privileged access (e.g. reading/writing `profiles`).
 * For server-side/privileged access use `getSupabaseAdmin` from
 * `@/lib/supabase-admin` instead.
 */
export const getSupabase = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase URL and Key are missing from Environment Variables",
    );
  }

  // If instance doesn't exist yet, create it. Otherwise, return the existing one.
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
};
