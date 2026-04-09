import FirecrawlApp from "@mendable/firecrawl-js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// Specific URL for Engineering -> Frontend roles
const TARGET_URL =
  "https://www.workatastartup.com/jobs?role=engineering&subrole=frontend";

async function scoutWaaS() {
  console.log("🚀 [WaaS Scout] Intercepting YC Startup signals...");

  try {
    // Fixed: Used TARGET_URL (uppercase) to match the definition above
    const scrape = await firecrawl.scrape(TARGET_URL, {
      formats: ["json"],
      actions: [
        { type: "scroll", direction: "bottom" },
        { type: "wait", milliseconds: 2000 },
        { type: "scroll", direction: "bottom" },
        { type: "wait", milliseconds: 2000 },
      ],
      jsonOptions: {
        schema: {
          type: "object",
          properties: {
            jobs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  location: { type: "string" },
                  url: { type: "string" },
                },
                required: ["title", "company", "url"],
              },
            },
          },
        },
      },
    });

    if (!scrape.success) throw new Error(scrape.error);

    const rawJobs = scrape.json.jobs || [];
    let newSignals = 0;

    for (const job of rawJobs) {
      const loc = (job.location || "").toLowerCase();

      // Filter: Prioritize Worldwide/Remote and avoid US-only geofences
      const isRestricted = /us only|usa only|north america|canada only/i.test(
        loc,
      );
      const isRemote = /remote|worldwide|anywhere/i.test(loc) || loc === "";

      if (isRemote && !isRestricted) {
        const fullUrl = job.url.startsWith("http")
          ? job.url
          : `https://www.workatastartup.com${job.url}`;

        // De-duplication check
        const { data: exists } = await supabase
          .from("jobs")
          .select("url")
          .eq("url", fullUrl)
          .maybeSingle();

        if (!exists) {
          const { error } = await supabase.from("jobs").insert([
            {
              title: job.title,
              company: job.company,
              url: fullUrl,
              location: job.location || "Remote",
              source: "yc-waas",
              status: "new",
            },
          ]);

          if (!error) {
            newSignals++;
            console.log(`✨ Signal Captured: ${job.title} @ ${job.company}`);
          }
        }
      }
    }

    console.log(`✅ WaaS Scout Finished. Found ${newSignals} new YC signals.`);
  } catch (err) {
    console.error("❌ WaaS Scout Failed:", err.message);
  }
}

scoutWaaS();
