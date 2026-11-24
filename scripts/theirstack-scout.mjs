import axios from "axios";
import { dedupeAndInsertJobs } from "./lib/db.mjs";
import { sendNewLeadsEmail } from "./lib/notify.mjs";
import dotenv from "dotenv";
dotenv.config();

function renderHtml(jobs) {
  return `
    <div style="background: #020617; color: #f8fafc; padding: 40px; font-family: sans-serif;">
      <h1 style="color: #38bdf8;">TheirStack Daily Intercept</h1>
      <p>Fresh ATS leads for Frontend & React roles.</p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;">
      ${jobs
        .map(
          (job) => `
        <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; border: 1px solid #1e293b; background: #0f172a;">
          <div style="font-weight: bold; font-size: 16px;">${job.title}</div>
          <div style="color: #38bdf8; margin: 5px 0;">${job.company}</div>
          <a href="${job.url}" style="color: #f8fafc; background: #38bdf8; padding: 5px 10px; text-decoration: none; border-radius: 4px; font-size: 12px; display: inline-block; margin-top: 10px;">VIEW APPLICATION →</a>
        </div>`,
        )
        .join("")}
    </div>`;
}

async function scoutTheirStack() {
  console.log("🕵️‍♂️ [TheirStack Intercept] Querying Global Job Engine...");

  try {
    const response = await axios.post(
      "https://api.theirstack.com/v1/jobs/search",
      {
        job_title_or: ["Frontend Engineer", "React Developer"],
        remote: true,
        posted_at_max_age_days: 1,
        limit: 20,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.THEIRSTACK_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const jobs = response.data.data || [];

    const candidateJobs = jobs.map((job) => ({
      title: job.job_title,
      company: job.company_name || "Unknown",
      url: job.url,
      location: "Remote (Global)",
      source: "theirstack",
      status: "new",
    }));

    const newLeads = await dedupeAndInsertJobs(candidateJobs);

    if (newLeads.length > 0) {
      console.log(`📨 ${newLeads.length} leads found. Dispatching email...`);

      const result = await sendNewLeadsEmail({
        from: "TheirStack-Intel <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🎯 TheirStack: ${newLeads.length} New Global Roles`,
        jobs: newLeads,
        renderHtml,
      });

      if (result.sent) console.log("📨 Email sent successfully!");
      else console.error("❌ Resend Error:", result.reason);
    } else {
      console.log("ℹ️ No new unique signals found.");
    }
  } catch (err) {
    console.error("❌ TheirStack Failure:", err.response?.data || err.message);
  }
}

scoutTheirStack();
