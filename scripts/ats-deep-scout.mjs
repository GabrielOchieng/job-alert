import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import pLimit from "p-limit";
import fetch from "node-fetch";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// --- CONFIG ---
const CONCURRENCY = 15;
const FRONTEND_REGEX =
  /frontend|react|next\.js|typescript|javascript|tailwind/i;
const RESTRICTED_REGIONS =
  /us only|usa only|united states|canada only|uk only|emea only|germany only|india only/i;

// Add high-growth, remote-first companies here
const GREENHOUSE_COMPANIES = [
  "stripe",
  "airbnb",
  "remote",
  "gitpod",
  "vercel",
  "canonical",
  "doist",
  "buffer",
  "elastic",
  "mazury",
  "cockroachlabs",
];
const LEVER_COMPANIES = [
  "postman",
  "mural",
  "khulnasoft",
  "chainlink",
  "framer",
  "duckduckgo",
  "close",
  "hotjar",
  "sourcegraph",
];

// --- HELPERS ---
function createFingerprint(job) {
  return crypto.createHash("md5").update(`${job.url}`).digest("hex");
}

function isFrontend(jobTitle) {
  return FRONTEND_REGEX.test(jobTitle);
}

function isTrulyGlobal(locationName) {
  if (!locationName) return true; // Benefit of the doubt
  const loc = locationName.toLowerCase();
  if (RESTRICTED_REGIONS.test(loc)) return false;
  return true;
}

// --- SCRAPERS ---
async function scrapeGreenhouse(company) {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.jobs) return [];

    return data.jobs
      .filter((j) => isFrontend(j.title))
      .filter((j) => isTrulyGlobal(j.location?.name))
      .map((job) => ({
        title: job.title,
        company: company.toUpperCase(),
        url: job.absolute_url,
        location: job.location?.name || "Remote",
        description: `Direct Greenhouse intercept for ${job.title}`,
        source: "greenhouse-direct",
        status: "new",
      }));
  } catch (err) {
    console.error(`❌ Greenhouse fail: ${company}`);
    return [];
  }
}

async function scrapeLever(company) {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${company}?mode=json`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((j) => isFrontend(j.text))
      .filter((j) => isTrulyGlobal(j.categories?.location))
      .map((job) => ({
        title: job.text,
        company: company.toUpperCase(),
        url: job.hostedUrl,
        location: job.categories?.location || "Remote",
        description: `Direct Lever intercept for ${job.text}`,
        source: "lever-direct",
        status: "new",
      }));
  } catch (err) {
    console.error(`❌ Lever fail: ${company}`);
    return [];
  }
}

// --- MAIN PIPELINE ---
async function runAtsScout() {
  const limit = pLimit(CONCURRENCY);
  console.log("📡 [ATS Deep-Scout] Starting Intercept...");

  const greenhousePromises = GREENHOUSE_COMPANIES.map((c) =>
    limit(() => scrapeGreenhouse(c)),
  );
  const leverPromises = LEVER_COMPANIES.map((c) => limit(() => scrapeLever(c)));

  const results = await Promise.all([...greenhousePromises, ...leverPromises]);
  const allJobs = results.flat();

  console.log(`🔍 Scanned ${allJobs.length} potential direct roles.`);

  let newCount = 0;
  for (const job of allJobs) {
    const fingerprint = createFingerprint(job);

    // URL-based deduplication
    const { data: exists } = await supabase
      .from("jobs")
      .select("url")
      .eq("url", job.url)
      .maybeSingle();

    if (!exists) {
      const { error } = await supabase
        .from("jobs")
        .insert([{ ...job, fingerprint }]);

      if (!error) newCount++;
    }
  }

  console.log(`✅ Pipeline Complete. Saved ${newCount} new direct-ATS leads.`);
}

runAtsScout();
