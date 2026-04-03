// import { createClient } from "@supabase/supabase-js";

// // Helper to get client only when needed
// export const getSupabase = () => {
//   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

//   if (!url || !key) {
//     throw new Error(
//       "Supabase URL and Key are missing from Environment Variables",
//     );
//   }

//   return createClient(url, key);
// };

// // Export a getter instead of a constant to prevent early evaluation crash
// export const supabase =
//   typeof window !== "undefined"
//     ? process.env.NEXT_PUBLIC_SUPABASE_URL
//       ? getSupabase()
//       : (null as any)
//     : getSupabase();

// export async function filterNewJobs(jobs: any[]) {
//   const client = getSupabase();
//   const urls = jobs.map((j) => j.url);

//   const { data: existingJobs } = await client
//     .from("jobs")
//     .select("url")
//     .in("url", urls);

//   const existingUrls = new Set(existingJobs?.map((j) => j.url) || []);
//   const newJobs = jobs.filter((j) => !existingUrls.has(j.url));

//   if (newJobs.length > 0) {
//     await client.from("jobs").insert(
//       newJobs.map((j) => ({
//         url: j.url,
//         title: j.title,
//         company: j.company,
//         status: "new",
//       })),
//     );
//   }
//   return newJobs;
// }

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 1. Define a private variable to hold the single instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Singleton Getter for Supabase Client
 * Ensures only ONE instance exists, preventing "Multiple GoTrueClient" warnings.
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

/**
 * Filter and save only new jobs that don't exist in the DB yet.
 */
export async function filterNewJobs(jobs: any[]) {
  const client = getSupabase();
  const urls = jobs.map((j) => j.url);

  // Check which URLs already exist in the database
  const { data: existingJobs } = await client
    .from("jobs")
    .select("url")
    .in("url", urls);

  const existingUrls = new Set(existingJobs?.map((j) => j.url) || []);

  // Filter local list against the database list
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
