import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import pLimit from "p-limit";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// --- CONFIG ---
const CONCURRENCY = 10;
const FRONTEND_KEYWORDS =
  /frontend|react|typescript|nextjs|javascript|tailwind|ui engineer/i;

// THE BOUNCER: Explicitly ignore roles locked to these regions
const RESTRICTED_REGIONS =
  /us only|usa only|united states|canada only|uk only|emea only|north america|based in us/i;

async function harvestVcJobs() {
  console.log("🏹 [VC Harvester] Starting High-Tier Signal Extraction...");

  // 1. Fetch all companies registered in your VC table
  const { data: companies, error: dbError } = await supabase
    .from("vc_companies")
    .select("*, vc_firms(name)")
    .eq("is_active", true);

  if (dbError || !companies) {
    console.error("❌ Error fetching target fleet:", dbError?.message);
    return;
  }

  console.log(`📡 Targeting ${companies.length} portfolio companies...`);

  const limit = pLimit(CONCURRENCY);

  // 2. Map through companies and build request promises
  const taskPromises = companies.map((company) =>
    limit(async () => {
      const url =
        company.ats_type === "greenhouse"
          ? `https://boards-api.greenhouse.io/v1/boards/${company.ats_handle}/jobs`
          : `https://api.lever.co/v0/postings/${company.ats_handle}?mode=json`;

      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();

        // Standardize different API structures
        const rawJobs =
          company.ats_type === "greenhouse" ? data.jobs || [] : data || [];

        return rawJobs
          .filter((j) => {
            const title = j.title || j.text || "";
            const loc = j.location?.name || j.categories?.location || "";

            // Logic: Must have frontend keywords AND must NOT mention restricted regions
            const hasKeywords = FRONTEND_KEYWORDS.test(title);
            const isNotGeofenced =
              !RESTRICTED_REGIONS.test(loc) && !RESTRICTED_REGIONS.test(title);

            return hasKeywords && isNotGeofenced;
          })
          .map((j) => ({
            title: j.title || j.text,
            company: company.company_name,
            url: j.absolute_url || j.hostedUrl,
            location: j.location?.name || j.categories?.location || "Remote",
            description: `Signal intercepted from ${company.vc_firms.name} portfolio: ${company.company_name}`,
            source: `vc-${company.vc_firms.name.toLowerCase()}`,
            status: "new",
          }));
      } catch (err) {
        console.error(
          `⚠️ Failed to scan ${company.company_name}:`,
          err.message,
        );
        return [];
      }
    }),
  );

  // 3. Execute all requests
  const results = await Promise.all(taskPromises);
  const foundJobs = results.flat();

  console.log(`🔍 Scanned ${foundJobs.length} potential matches.`);

  // 4. Save to main jobs table (with de-duplication)
  let newSignals = 0;
  for (const job of foundJobs) {
    const { data: exists } = await supabase
      .from("jobs")
      .select("url")
      .eq("url", job.url)
      .maybeSingle();

    if (!exists) {
      const { error: insertError } = await supabase.from("jobs").insert([job]);
      if (!insertError) {
        newSignals++;
        console.log(`✨ New Signal: ${job.title} @ ${job.company}`);
      }
    }
  }

  // 5. Update the 'last_scanned' timestamp for these companies
  const companyIds = companies.map((c) => c.id);
  if (companyIds.length > 0) {
    await supabase
      .from("vc_companies")
      .update({ last_scanned: new Date().toISOString() })
      .in("id", companyIds);
  }

  console.log(
    `✅ Harvest Complete. ${newSignals} new Tier-1 leads added to dashboard.`,
  );
}

harvestVcJobs();
