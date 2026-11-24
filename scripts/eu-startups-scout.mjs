import FirecrawlApp from "@mendable/firecrawl-js";
import { generateColdOutreach } from "./outreach-generator.mjs";
import { findNewJobs, insertJobs } from "./lib/db.mjs";
import { sendNewLeadsEmail } from "./lib/notify.mjs";
import dotenv from "dotenv";
dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

const TARGET_URL = "https://www.eu-startups.com/jobs/";

function renderHtml(jobs) {
  return `
    <div style="background: #003399; color: #ffffff; padding: 40px; font-family: sans-serif; border-top: 4px solid #ffcc00;">
      <h1 style="color: #ffcc00; font-size: 22px;">European Startup Intelligence</h1>
      <p style="color: #e2e8f0;">Roles matched for Nairobi Timezone (GMT+3).</p>
      ${jobs
        .map(
          (job) => `
        <div style="margin-top: 20px; background: #ffffff; color: #1e293b; padding: 20px; border-radius: 8px;">
          <h3 style="margin: 0; color: #003399;">${job.title}</h3>
          <p><strong>Company:</strong> ${job.company} | <strong>Status:</strong> ${job.location}</p>
          <a href="${job.url}" style="color: #003399; font-weight: bold;">VIEW LEAD →</a>

          <div style="margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 13px;">
            <p style="color: #64748b;"><strong>LinkedIn Connect:</strong><br>${job.outreach.linkedin}</p>
            <p style="color: #64748b;"><strong>Email/DM Draft:</strong><br>${job.outreach.email}</p>
          </div>
        </div>`,
        )
        .join("")}
    </div>`;
}

async function scoutEUTech() {
  console.log("🇪🇺 [EU-Startups Scout] Intercepting FRESH Euro-leads...");

  try {
    const scrape = await firecrawl.scrape(TARGET_URL, {
      formats: [
        {
          type: "json",
          // UPDATED PROMPT: Added strict instruction for dates
          prompt:
            "Extract the current list of frontend jobs. For each job, find the title, company, URL, and the 'posted date' or 'time ago'. Only include jobs that do NOT say 'Expired' or 'Closed'.",
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
                    posted_at: { type: "string" }, // New field
                  },
                  required: ["title", "url", "posted_at"],
                },
              },
            },
          },
        },
      ],
      waitFor: 4000,
    });

    const rawJobs = scrape.json?.jobs || [];

    // FRESHNESS FILTER: Reject jobs older than 7 days or tagged as "30+ days"
    // EU-Startups often marks old jobs with "1 month ago" or "3 weeks ago"
    const candidateJobs = rawJobs
      .filter((job) => {
        const isTooOld = /week|month|30\+|14|21/i.test(job.posted_at);
        const isFrontend = /frontend|react|typescript|next|javascript/i.test(
          job.title,
        );
        if (isTooOld) {
          console.log(`⏩ Skipping stale job: ${job.title} (${job.posted_at})`);
        }
        return isFrontend && !isTooOld;
      })
      .map((job) => ({
        title: job.title,
        company: job.company || "EU Startup",
        url: job.url,
        location: `Remote (Posted: ${job.posted_at})`,
        source: "eu-startups",
        status: "new",
      }));

    const newJobs = await findNewJobs(candidateJobs);

    const newLeads = [];
    for (const job of newJobs) {
      console.log(`✅ Fresh Euro-Lead Found: ${job.title}`);
      const outreach = await generateColdOutreach(job);
      newLeads.push({ ...job, outreach });
    }

    await insertJobs(newJobs);

    await sendNewLeadsEmail({
      from: "EU-Startups-Intel <onboarding@resend.dev>",
      to: process.env.MY_EMAIL,
      subject: `🇪🇺 ${newLeads.length} FRESH Euro-Signals Found`,
      jobs: newLeads,
      renderHtml,
    });
  } catch (err) {
    console.error("❌ EU Scout Failure:", err.message);
  }
}

scoutEUTech();
