import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import pLimit from "p-limit"; // controls concurrency
import fetch from "node-fetch"; // Node 20+ built-in fetch

const __dirname = path.dirname(new URL(import.meta.url).pathname);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// -----------------------------
// CONFIG
// -----------------------------
const CONCURRENCY = 20; // Adjust based on API limits
const FRONTEND_REGEX = /frontend|react|next\.js|typescript|javascript/i;

const GREENHOUSE_COMPANIES = [
  "stripe",
  "shopify",
  "airbnb" /* add hundreds more */,
];

const LEVER_COMPANIES = ["netlify", "vercel" /* add hundreds more */];

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
// SCRAPERS
// -----------------------------
async function scrapeGreenhouse(company) {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
    );
    const data = await res.json();
    return data.jobs.filter(isFrontend).map((job) => ({
      title: job.title,
      company,
      url: job.absolute_url,
      location: job.location?.name || "Remote",
      source: "greenhouse",
      posted_at: job.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error(`❌ Greenhouse failed for ${company}:`, err.message);
    return [];
  }
}

async function scrapeLever(company) {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${company}?mode=json`,
    );
    const data = await res.json();
    return data.filter(isFrontend).map((job) => ({
      title: job.text,
      company,
      url: job.hostedUrl,
      location: job.categories?.location || "Remote",
      source: "lever",
      posted_at: job.createdAt
        ? new Date(job.createdAt).toISOString()
        : new Date().toISOString(),
    }));
  } catch (err) {
    console.error(`❌ Lever failed for ${company}:`, err.message);
    return [];
  }
}

// -----------------------------
// FETCH ALL COMPANIES CONCURRENTLY
// -----------------------------
async function fetchAllJobs() {
  const limit = pLimit(CONCURRENCY);
  const greenhouseJobs = await Promise.all(
    GREENHOUSE_COMPANIES.map((c) => limit(() => scrapeGreenhouse(c))),
  );
  const leverJobs = await Promise.all(
    LEVER_COMPANIES.map((c) => limit(() => scrapeLever(c))),
  );

  return [...greenhouseJobs.flat(), ...leverJobs.flat()];
}

// -----------------------------
// SAVE TO DB
// -----------------------------
async function saveJobs(jobs) {
  const newJobs = [];

  for (const job of jobs) {
    const fingerprint = createFingerprint(job);

    const { data: exists } = await supabase
      .from("jobs")
      .select("id")
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    if (!exists) {
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

      if (!error && data) newJobs.push(data);
    }
  }

  return newJobs;
}

// -----------------------------
// MAIN
// -----------------------------
(async () => {
  console.log("🚀 Running scaled job pipeline...");
  const jobs = await fetchAllJobs();
  console.log(`📡 Total jobs fetched: ${jobs.length}`);

  const newJobs = await saveJobs(jobs);
  console.log(`🆕 New jobs saved: ${newJobs.length}`);
})();
