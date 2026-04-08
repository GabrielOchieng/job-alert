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

// --- HELPERS ---
function createFingerprint(job) {
  return crypto.createHash("md5").update(`${job.url}`).digest("hex");
}

function isFrontend(jobTitle) {
  return FRONTEND_REGEX.test(jobTitle);
}

function isTrulyGlobal(locationName) {
  if (!locationName) return true;
  const loc = locationName.toLowerCase();
  if (RESTRICTED_REGIONS.test(loc)) return false;
  return true;
}

/**
 * 🕵️‍♂️ AUTO-DISCOVERY
 * Extracts handles from URLs to expand your database automatically
 */
async function discoverNewCompany(url) {
  let handle = null;
  let type = null;

  if (url.includes("boards.greenhouse.io/")) {
    handle = url.split("boards.greenhouse.io/")[1].split("/")[0].split("?")[0];
    type = "greenhouse";
  } else if (url.includes("jobs.lever.co/")) {
    handle = url.split("jobs.lever.co/")[1].split("/")[0].split("?")[0];
    type = "lever";
  }

  if (handle && type) {
    await supabase
      .from("target_companies")
      .upsert({ handle, ats_type: type }, { onConflict: "handle" });
  }
}

// --- SCRAPERS ---
async function scrapeGreenhouse(company) {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || [])
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
    return (data || [])
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
    return [];
  }
}

// --- MAIN PIPELINE ---
async function runAtsScout() {
  const limit = pLimit(CONCURRENCY);

  // 1. Fetch current target fleet from DB
  const { data: targets, error: fetchErr } = await supabase
    .from("target_companies")
    .select("handle, ats_type")
    .eq("is_active", true);

  if (fetchErr || !targets) {
    console.error("❌ Could not load target fleet.");
    return;
  }

  console.log(`📡 [ATS Deep-Scout] Scanning ${targets.length} targets...`);

  const promises = targets.map((target) =>
    limit(() =>
      target.ats_type === "greenhouse"
        ? scrapeGreenhouse(target.handle)
        : scrapeLever(target.handle),
    ),
  );

  const results = await Promise.all(promises);
  const allJobs = results.flat();

  let newCount = 0;
  for (const job of allJobs) {
    const fingerprint = createFingerprint(job);

    const { data: exists } = await supabase
      .from("jobs")
      .select("url")
      .eq("url", job.url)
      .maybeSingle();

    if (!exists) {
      const { error } = await supabase
        .from("jobs")
        .insert([{ ...job, fingerprint }]);

      if (!error) {
        newCount++;
        // Try to discover company if it's a sub-board
        await discoverNewCompany(job.url);
      }
    }
  }

  console.log(`✅ Sync Complete. +${newCount} new leads.`);
}

runAtsScout();
