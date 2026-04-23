import FirecrawlApp from "@mendable/firecrawl-js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// Targeted URL for Frontend roles specifically in Africa/Remote
const TARGET_URL =
  "https://jobgether.com/remote-jobs/africa/frontend-developer";

async function scoutJobgether() {
  console.log(
    "🌍 [Jobgether Scout] Scanning for Africa-friendly remote roles...",
  );

  try {
    const scrape = await firecrawl.scrape(TARGET_URL, {
      // Corrected structure for 2026 Firecrawl SDK
      formats: ["json"],
      jsonOptions: {
        type: "json", // Must explicitly state type
        prompt:
          "Extract all frontend or react developer job listings from the page. Include the title, company name, and the link to the job.",
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
                  url: { type: "string" },
                },
                required: ["title", "url"],
              },
            },
          },
        },
      },
      waitFor: 3000,
    });

    if (!scrape.success) throw new Error(scrape.error);

    const rawJobs = scrape.json.jobs || [];
    let newSignals = 0;

    for (const job of rawJobs) {
      // Basic title filter to ensure it's Frontend/React related
      if (/frontend|react|typescript|nextjs|ui/i.test(job.title)) {
        const fullUrl = job.url.startsWith("http")
          ? job.url
          : `https://jobgether.com${job.url}`;

        const { data: exists } = await supabase
          .from("jobs")
          .select("url")
          .eq("url", fullUrl)
          .maybeSingle();

        if (!exists) {
          const { error } = await supabase.from("jobs").insert([
            {
              title: job.title,
              company: job.company || "Unknown Company",
              url: fullUrl,
              location: "Remote (Africa-Friendly)",
              source: "jobgether",
              status: "new",
            },
          ]);

          if (!error) {
            newSignals++;
            console.log(`✅ Jobgether Lead: ${job.title}`);
          }
        }
      }
    }

    console.log(
      `🏁 Finished. Captured ${newSignals} new roles from Jobgether.`,
    );
  } catch (err) {
    console.error("❌ Jobgether Scout Failed:", err.message);
  }
}

scoutJobgether();
