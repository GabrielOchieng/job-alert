import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import pLimit from "p-limit";
import fetch from "node-fetch";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// -----------------------------
// CONFIG
// -----------------------------
const CONCURRENCY = 20;
const FRONTEND_REGEX = /frontend|react|next\.js|typescript|javascript/i;

// Example companies (expand to 1000+)
const GREENHOUSE_COMPANIES = ["stripe", "shopify", "airbnb"];
const LEVER_COMPANIES = ["netlify", "vercel"];
const REMOTEOK_TAG = "frontend"; // tag for RemoteOK
const WWR_TAG = "frontend"; // category for WeWorkRemotely

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
// GREENHOUSE SCRAPER
// -----------------------------
async function scrapeGreenhouse(company) {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
    );
    const data = await res.json();

    if (!data || !Array.isArray(data.jobs)) return [];

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

// -----------------------------
// LEVER SCRAPER
// -----------------------------
async function scrapeLever(company) {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${company}?mode=json`,
    );
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    return data.filter(isFrontend).map((job) => ({
      title: job.text || job.position || "Unknown",
      company,
      url: job.hostedUrl || job.applyUrl || "",
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
// REMOTEOK SCRAPER
// -----------------------------
async function scrapeRemoteOK(tag = "frontend") {
  try {
    const res = await fetch(`https://remoteok.com/api`);
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    return data
      .filter((job) => job.position && isFrontend(job))
      .map((job) => ({
        title: job.position,
        company: job.company || "RemoteOK",
        url: job.url,
        location: job.location || "Remote",
        source: "remoteok",
        posted_at: job.date || new Date().toISOString(),
      }));
  } catch (err) {
    console.error("❌ RemoteOK failed:", err.message);
    return [];
  }
}

// -----------------------------
// WeWorkRemotely SCRAPER
// -----------------------------
async function scrapeWWR(category = "frontend") {
  try {
    const res = await fetch(
      `https://weworkremotely.com/categories/${category}`,
    );
    const text = await res.text();

    // Simple regex parsing
    const jobMatches = Array.from(
      text.matchAll(/<a href="(\/remote-jobs\/[^"]+)".*?>(.*?)<\/a>/g),
    );

    return jobMatches.map(([_, url, title]) => ({
      title: title.replace(/<[^>]+>/g, "").trim(),
      company: "Unknown",
      url: `https://weworkremotely.com${url}`,
      location: "Remote",
      source: "wwr",
      posted_at: new Date().toISOString(),
    }));
  } catch (err) {
    console.error("❌ WWR failed:", err.message);
    return [];
  }
}

// -----------------------------
// FETCH ALL JOBS CONCURRENTLY
// -----------------------------
async function fetchAllJobs() {
  const limit = pLimit(CONCURRENCY);

  const greenhouseJobs = await Promise.all(
    GREENHOUSE_COMPANIES.map((c) => limit(() => scrapeGreenhouse(c))),
  );

  const leverJobs = await Promise.all(
    LEVER_COMPANIES.map((c) => limit(() => scrapeLever(c))),
  );

  const remoteOKJobs = await scrapeRemoteOK(REMOTEOK_TAG);
  const wwrJobs = await scrapeWWR(WWR_TAG);

  return [
    ...greenhouseJobs.flat(),
    ...leverJobs.flat(),
    ...remoteOKJobs,
    ...wwrJobs,
  ];
}

// -----------------------------
// SAVE TO SUPABASE
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
        .insert([{ ...job, fingerprint, first_seen: new Date().toISOString() }])
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
  console.log("🚀 Running full-scale job pipeline...");
  const jobs = await fetchAllJobs();
  console.log(`📡 Total jobs fetched: ${jobs.length}`);

  const newJobs = await saveJobs(jobs);
  console.log(`🆕 New jobs saved: ${newJobs.length}`);
})();
