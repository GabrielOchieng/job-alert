import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * Never import this from a Client Component or anything that ships to the browser —
 * the service role key bypasses Row Level Security entirely.
 */

let adminInstance: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (typeof window !== "undefined") {
    throw new Error(
      "getSupabaseAdmin() was called in the browser. It uses the Supabase service role key and must only run server-side.",
    );
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) are missing from environment variables.",
    );
  }

  if (!adminInstance) {
    adminInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminInstance;
};

/**
 * Filter and save only new jobs that don't exist in the DB yet.
 * Runs with the service role key so it works regardless of RLS policy on `jobs`.
 */
export async function filterNewJobs(jobs: any[]) {
  const client = getSupabaseAdmin();
  const urls = jobs.map((j) => j.url);

  const { data: existingJobs } = await client
    .from("jobs")
    .select("url")
    .in("url", urls);

  const existingUrls = new Set(existingJobs?.map((j) => j.url) || []);
  const newJobs = jobs.filter((j) => !existingUrls.has(j.url));

  if (newJobs.length > 0) {
    const { error } = await client.from("jobs").insert(
      newJobs.map((j) => ({
        url: j.url,
        title: j.title,
        company: j.company,
        status: "new",
      })),
    );

    if (error) console.error("Error inserting new jobs:", error);
  }

  return newJobs;
}
