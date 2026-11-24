import FirecrawlApp from "@mendable/firecrawl-js";
import { generateColdOutreach } from "./outreach-generator.mjs"; // Imported your logic
import { findNewJobs, insertJobs } from "./lib/db.mjs";
import { sendNewLeadsEmail } from "./lib/notify.mjs";
import dotenv from "dotenv";
dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

const TARGET_URL =
  "https://jobgether.com/remote-jobs/africa/frontend-developer";

function renderHtml(jobs) {
  return `
    <div style="background: #020617; color: #f8fafc; padding: 40px; font-family: sans-serif; border-top: 4px solid #10b981;">
      <h1 style="color: #10b981; font-size: 20px; text-transform: uppercase;">Africa Region Intelligence</h1>
      <p style="color: #94a3b8;">Fresh remote opportunities with generated outreach scripts.</p>

      ${jobs
        .map(
          (job) => `
        <div style="margin-top: 25px; background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #1e293b;">
          <div style="font-size: 18px; font-weight: bold; color: #f8fafc;">${job.title}</div>
          <div style="color: #10b981; font-weight: 600; margin: 5px 0;">${job.company}</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 15px;">Status: ${job.location}</div>

          <a href="${job.url}" style="display: inline-block; background: #10b981; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: bold;">OPEN JOB →</a>

          <div style="margin-top: 20px; border-top: 1px solid #1e293b; padding-top: 15px;">
             <p style="font-size: 11px; color: #3b82f6; text-transform: uppercase; margin: 0 0 8px 0;">LinkedIn Script:</p>
             <div style="background: #020617; padding: 12px; border-radius: 6px; font-size: 13px; font-family: monospace; color: #cbd5e1; border: 1px dashed #1e293b;">${job.outreach.linkedin}</div>

             <p style="font-size: 11px; color: #10b981; text-transform: uppercase; margin: 15px 0 8px 0;">Cold Email / DM:</p>
             <div style="background: #020617; padding: 12px; border-radius: 6px; font-size: 13px; font-family: monospace; color: #cbd5e1; border: 1px dashed #1e293b;">${job.outreach.email}</div>
          </div>
        </div>`,
        )
        .join("")}

      <p style="font-size: 10px; color: #475569; margin-top: 40px; text-align: center;">Cipher Hunt Region Agent v2.1</p>
    </div>`;
}

async function scoutJobgether() {
  console.log(
    "🌍 [Jobgether Scout] Scanning for FRESH Africa-friendly remote roles...",
  );

  try {
    const scrape = await firecrawl.scrape(TARGET_URL, {
      formats: [
        {
          type: "json",
          prompt:
            "Extract job postings. For each job, find the title, company name, the job link, and how long ago it was posted.",
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
                    posted_date: { type: "string" },
                  },
                  required: ["title", "url", "posted_date"],
                },
              },
            },
          },
        },
      ],
      waitFor: 5000,
    });

    const rawJobs = scrape.json?.jobs || [];

    const candidateJobs = rawJobs
      .filter((job) => {
        const titleMatch = /frontend|react|typescript|nextjs|ui/i.test(job.title);
        const isTooOld = /30\+|month|31|60|90/i.test(job.posted_date);
        return titleMatch && !isTooOld;
      })
      .map((job) => {
        const fullUrl = job.url.startsWith("http")
          ? job.url
          : `https://jobgether.com${job.url}`;
        return {
          title: job.title,
          company: job.company || "Unknown",
          url: fullUrl,
          location: `Remote (${job.posted_date})`,
          source: "jobgether",
          status: "new",
        };
      });

    const newJobs = await findNewJobs(candidateJobs);

    const newLeads = [];
    for (const job of newJobs) {
      // 1. Generate outreach using your separate file logic
      console.log(`🤖 Decrypting Outreach Strategy for: ${job.company}...`);
      const outreach = await generateColdOutreach(job);
      newLeads.push({ ...job, outreach });
      console.log(`✅ Fresh Signal Saved: ${job.title}`);
    }

    // 2. Insert into Command Center
    await insertJobs(newJobs);

    // --- RESEND DISPATCH ---
    if (newLeads.length > 0) {
      console.log(
        `📨 Dispatching Intelligence Report: ${newLeads.length} leads.`,
      );

      const result = await sendNewLeadsEmail({
        from: "Jobgether-Intel <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🌍 Jobgether: ${newLeads.length} Roles + Battle Scripts`,
        jobs: newLeads,
        renderHtml,
      });

      if (result.sent) console.log("📨 Intelligence email dispatched!");
      else console.error("❌ Resend Error:", result.reason);
    } else {
      console.log("ℹ️ No new fresh signals detected.");
    }
  } catch (err) {
    console.error("❌ Jobgether Scout Failure:", err.message);
  }
}

scoutJobgether();
