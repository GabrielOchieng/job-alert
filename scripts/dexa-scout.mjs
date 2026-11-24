import FirecrawlApp from "@mendable/firecrawl-js";
import { generateColdOutreach } from "./outreach-generator.mjs";
import { findNewJobs, insertJobs } from "./lib/db.mjs";
import { sendNewLeadsEmail } from "./lib/notify.mjs";
import { reportFailure } from "./lib/alert.mjs";
import dotenv from "dotenv";
dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

const TARGET_URL = "https://jobswithdexa.co.uk/";

function renderHtml(jobs) {
  return `
    <div style="background: #1e1b4b; color: #ffffff; padding: 40px; font-family: sans-serif; border-top: 4px solid #4f46e5;">
      <h1 style="color: #818cf8; font-size: 22px;">UK/Remote Dexa Intercept</h1>
      <p style="color: #94a3b8;">Frontend signals matched for GMT+3 compatibility.</p>
      ${jobs
        .map(
          (job) => `
        <div style="margin-top: 25px; background: #ffffff; color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0; color: #4f46e5;">${job.title}</h3>
          <p><strong>Company:</strong> ${job.company} | <strong>Status:</strong> ${job.location}</p>
          <a href="${job.url}" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">APPLY NOW →</a>

          <div style="margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 15px; background: #f8fafc; border-radius: 8px; padding: 15px;">
            <p style="color: #64748b; font-size: 11px; text-transform: uppercase;"><strong>LinkedIn Strategy:</strong></p>
            <p style="color: #334155; font-family: monospace;">${job.outreach.linkedin}</p>

            <p style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-top: 15px;"><strong>Cold Email Draft:</strong></p>
            <p style="color: #334155; font-family: monospace;">${job.outreach.email}</p>
          </div>
        </div>`,
        )
        .join("")}
    </div>`;
}

async function scoutDexa() {
  console.log("🕵️‍♂️ [Dexa Scout] Intercepting fresh UK/Remote leads...");

  try {
    const scrape = await firecrawl.scrape(TARGET_URL, {
      formats: [
        {
          type: "json",
          prompt:
            "Extract frontend developer job postings. For each job, find the title, company name, URL, and the 'time ago' it was posted. Only include jobs that are tagged as 'Remote'.",
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
                    posted_at: { type: "string" },
                  },
                  required: ["title", "url"],
                },
              },
            },
          },
        },
      ],
      waitFor: 5000,
    });

    const rawJobs = scrape.json?.jobs || [];

    // Logic check: Must be Frontend/React and NOT older than a few days
    const candidateJobs = rawJobs
      .filter((job) => {
        const isFrontend = /frontend|react|next|typescript|web|ui/i.test(
          job.title,
        );
        const isFresh = !/30\+|month|week|14|21/i.test(job.posted_at || "");
        return isFrontend && isFresh;
      })
      .map((job) => ({
        title: job.title,
        company: job.company || "Dexa Partner",
        url: job.url,
        location: `Remote (${job.posted_at || "Recent"})`,
        source: "jobswithdexa",
        status: "new",
      }));

    const newJobs = await findNewJobs(candidateJobs);

    // Generate outreach copy per lead before insert (unchanged from before).
    const newLeads = [];
    for (const job of newJobs) {
      console.log(`🤖 Generating Intelligence for: ${job.company}...`);
      const outreach = await generateColdOutreach(job);
      newLeads.push({ ...job, outreach });
    }

    await insertJobs(newJobs);

    // --- RESEND DISPATCH ---
    const result = await sendNewLeadsEmail({
      from: "Dexa-Alerts <onboarding@resend.dev>",
      to: process.env.MY_EMAIL,
      subject: `🇬🇧 Dexa-UK: ${newLeads.length} High-Signal Leads`,
      jobs: newLeads,
      renderHtml,
    });
    if (result.sent) console.log(`📨 ${newLeads.length} Dexa-leads dispatched!`);
  } catch (err) {
    await reportFailure("dexa-scout", err);
  }
}

scoutDexa();
