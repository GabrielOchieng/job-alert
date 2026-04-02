import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function filterNewJobs(jobs: any[]) {
  if (jobs.length === 0) return [];

  const urls = jobs.map((j) => j.url);

  // 1. Check for existing jobs
  const { data: existingJobs, error: fetchError } = await supabase
    .from("jobs")
    .select("url")
    .in("url", urls);

  if (fetchError) {
    console.error("Supabase Fetch Error:", fetchError);
    return jobs; // Fallback: return all jobs if DB fails
  }

  const existingUrls = new Set(existingJobs?.map((j) => j.url) || []);
  const newJobs = jobs.filter((j) => !existingUrls.has(j.url));

  // 2. Insert only the truly new ones
  if (newJobs.length > 0) {
    const { error: insertError } = await supabase
      .from("jobs")
      .insert(newJobs.map((j) => ({ url: j.url })));

    if (insertError) console.error("Supabase Insert Error:", insertError);
  }

  return newJobs;
}
