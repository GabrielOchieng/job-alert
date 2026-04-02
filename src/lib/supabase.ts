import { createClient } from "@supabase/supabase-js";

// Helper to get client only when needed
export const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase URL and Key are missing from Environment Variables",
    );
  }

  return createClient(url, key);
};

// Export a getter instead of a constant to prevent early evaluation crash
export const supabase =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
      ? getSupabase()
      : (null as any)
    : getSupabase();

export async function filterNewJobs(jobs: any[]) {
  const client = getSupabase();
  const urls = jobs.map((j) => j.url);

  const { data: existingJobs } = await client
    .from("jobs")
    .select("url")
    .in("url", urls);

  const existingUrls = new Set(existingJobs?.map((j) => j.url) || []);
  const newJobs = jobs.filter((j) => !existingUrls.has(j.url));

  if (newJobs.length > 0) {
    await client.from("jobs").insert(
      newJobs.map((j) => ({
        url: j.url,
        title: j.title,
        company: j.company,
        status: "new",
      })),
    );
  }
  return newJobs;
}
