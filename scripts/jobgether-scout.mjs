import FirecrawlApp from "@mendable/firecrawl-js";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);
const resend = new Resend(process.env.RESEND_API_KEY);

const TARGET_URL =
  "https://jobgether.com/remote-jobs/africa/frontend-developer";

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
            "Extract job postings. For each job, find the title, company name, the job link, and how long ago it was posted (e.g., 'Today', '3 days ago', '30+ days ago').",
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
    const newLeads = [];

    for (const job of rawJobs) {
      // 1. Filter: Role must be Frontend/React related
      const titleMatch = /frontend|react|typescript|nextjs|ui/i.test(job.title);

      // 2. Filter: Reject stale jobs (30+ days or "month" mentioned)
      const isTooOld = /30\+|month|31|60|90/i.test(job.posted_date);

      if (titleMatch && !isTooOld) {
        const fullUrl = job.url.startsWith("http")
          ? job.url
          : `https://jobgether.com${job.url}`;

        // Check deduplication
        const { data: existing } = await supabase
          .from("jobs")
          .select("url")
          .eq("url", fullUrl)
          .maybeSingle();

        if (!existing) {
          const { data: inserted, error: insertError } = await supabase
            .from("jobs")
            .insert([
              {
                title: job.title,
                company: job.company || "Unknown",
                url: fullUrl,
                location: `Remote (${job.posted_date})`,
                source: "jobgether",
                status: "new",
              },
            ])
            .select()
            .single();

          if (inserted) {
            newLeads.push(inserted);
            console.log(`✅ Fresh Signal: ${job.title} @ ${job.company}`);
          }
        }
      }
    }

    // --- RESEND EMAIL BLOCK ---
    if (newLeads.length > 0) {
      console.log(
        `📧 Dispatching ${newLeads.length} leads to email via Resend...`,
      );

      const { data, error } = await resend.emails.send({
        from: "Jobgether-Alerts <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🌍 Jobgether: ${newLeads.length} New Africa-Friendly Roles`,
        html: `
          <div style="background: #020617; color: #f8fafc; padding: 40px; font-family: sans-serif; border-top: 4px solid #10b981;">
            <h1 style="color: #10b981; font-size: 20px; text-transform: uppercase;">Jobgether Africa Intel</h1>
            <p style="color: #94a3b8;">Fresh remote opportunities detected in your region.</p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;">
            ${newLeads
              .map(
                (j) => `
              <div style="margin-bottom: 20px; background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #1e293b;">
                <div style="font-size: 16px; font-weight: bold;">${j.title}</div>
                <div style="color: #10b981; margin: 4px 0;">${j.company}</div>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">${j.location}</div>
                <a href="${j.url}" style="color: white; background: #10b981; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px;">VIEW ROLE →</a>
              </div>
            `,
              )
              .join("")}
          </div>
        `,
      });

      if (error) console.error("❌ Resend Error:", error.message);
      else console.log("📨 Email dispatched successfully!");
    } else {
      console.log("ℹ️ No new fresh signals found this run.");
    }
  } catch (err) {
    console.error("❌ Jobgether Scout Failure:", err.message);
  }
}

scoutJobgether();
