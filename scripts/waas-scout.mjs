import FirecrawlApp from "@mendable/firecrawl-js";
import { dedupeAndInsertJobs } from "./lib/db.mjs";
import { reportFailure } from "./lib/alert.mjs";
import dotenv from "dotenv";

dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

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

    // Filter: Prioritize Worldwide/Remote and avoid US-only geofences
    const candidateJobs = rawJobs
      .filter((job) => {
        const loc = (job.location || "").toLowerCase();
        const isRestricted = /us only|usa only|north america|canada only/i.test(
          loc,
        );
        const isRemote = /remote|worldwide|anywhere/i.test(loc) || loc === "";
        return isRemote && !isRestricted;
      })
      .map((job) => ({
        title: job.title,
        company: job.company,
        url: job.url.startsWith("http")
          ? job.url
          : `https://www.workatastartup.com${job.url}`,
        location: job.location || "Remote",
        source: "yc-waas",
        status: "new",
      }));

    const newLeads = await dedupeAndInsertJobs(candidateJobs);
    for (const lead of newLeads) {
      console.log(`✨ Signal Captured: ${lead.title} @ ${lead.company}`);
    }

    console.log(`✅ WaaS Scout Finished. Found ${newLeads.length} new YC signals.`);
  } catch (err) {
    await reportFailure("waas-scout", err);
  }
}

scoutWaaS();
