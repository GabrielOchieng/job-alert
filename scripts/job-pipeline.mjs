import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// -----------------------------
// CONFIG
// -----------------------------
const GREENHOUSE_COMPANIES = ["stripe", "shopify", "airbnb"];
const LEVER_COMPANIES = ["netlify", "vercel"];

const FRONTEND_REGEX = /frontend|react|next\.js|typescript|javascript/i;

// -----------------------------
// HELPERS
// -----------------------------
function createFingerprint(job) {
  return crypto
    .createHash("md5")
    .update(`${job.title}-${job.company}-${job.location}`)
    .digest("hex");
}

function isFrontend(job) {
  return FRONTEND_REGEX.test(job.title);
}

// -----------------------------
// GREENHOUSE
// -----------------------------
async function scrapeGreenhouse() {
  let results = [];

  for (const company of GREENHOUSE_COMPANIES) {
    try {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
      );
      const data = await res.json();

      const jobs = data.jobs.filter(isFrontend).map((job) => ({
        title: job.title,
        company,
        url: job.absolute_url,
        location: job.location?.name || "Remote",
        source: "greenhouse",
        posted_at: job.updated_at || new Date().toISOString(),
      }));

      results.push(...jobs);
    } catch (err) {
      console.error(`❌ Greenhouse error (${company}):`, err.message);
    }
  }

  return results;
}

// -----------------------------
// LEVER
// -----------------------------
async function scrapeLever() {
  let results = [];

  for (const company of LEVER_COMPANIES) {
    try {
      const res = await fetch(
        `https://api.lever.co/v0/postings/${company}?mode=json`,
      );
      const data = await res.json();

      const jobs = data.filter(isFrontend).map((job) => ({
        title: job.text,
        company,
        url: job.hostedUrl,
        location: job.categories?.location || "Remote",
        source: "lever",
        posted_at: job.createdAt
          ? new Date(job.createdAt).toISOString()
          : new Date().toISOString(),
      }));

      results.push(...jobs);
    } catch (err) {
      console.error(`❌ Lever error (${company}):`, err.message);
    }
  }

  return results;
}

// -----------------------------
// TWITTER (OPTIONAL KEEP)
// -----------------------------
async function scrapeTwitter() {
  // Keep your existing Firecrawl + Gemini logic here
  return [];
}

// -----------------------------
// SAVE TO DB
// -----------------------------
async function saveJobs(jobs) {
  let newJobs = [];

  for (const job of jobs) {
    const fingerprint = createFingerprint(job);

    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase
        .from("jobs")
        .insert([
          {
            ...job,
            fingerprint,
            first_seen: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (!error && data) {
        console.log(`✅ NEW: ${job.title} @ ${job.company}`);
        newJobs.push(data);
      }
    }
  }

  return newJobs;
}

// -----------------------------
// MAIN PIPELINE
// -----------------------------
async function runPipeline() {
  console.log("🚀 Running Job Intelligence Pipeline...");

  const jobs = [
    ...(await scrapeGreenhouse()),
    ...(await scrapeLever()),
    ...(await scrapeTwitter()),
  ];

  console.log(`📡 Total fetched: ${jobs.length}`);

  const uniqueJobs = await saveJobs(jobs);

  console.log(`🆕 New jobs: ${uniqueJobs.length}`);
}

runPipeline();
