import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { generateColdOutreach } from "./outreach-generator.mjs";
import dotenv from "dotenv";
dotenv.config();

// Initialize Clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: { persistSession: false }, // Fixes session warning in GitHub Actions
  },
);
const resend = new Resend(process.env.RESEND_API_KEY);

async function scoutTheirStack() {
  console.log("🕵️‍♂️ [TheirStack Intercept] Querying Global Job Engine...");

  try {
    const response = await axios.get(
      "https://api.theirstack.com/v1/jobs/search",
      {
        params: {
          query: "Frontend Engineer OR React Developer",
          location: "Remote",
          posted_after: new Date(
            Date.now() - 24 * 60 * 60 * 1000,
          ).toISOString(), // Last 24 hours
          limit: 20,
        },
        headers: { Authorization: `Bearer ${process.env.THEIRSTACK_API_KEY}` },
      },
    );

    const jobs = response.data.data || [];
    const newLeads = [];

    for (const job of jobs) {
      // 1. Deduplication check
      const { data: existing } = await supabase
        .from("jobs")
        .select("url")
        .eq("url", job.url)
        .maybeSingle();

      if (!existing) {
        console.log(`🤖 Processing: ${job.company?.name || "Unknown Company"}`);

        // 2. Generate Outreach via your AI Fallback script
        const outreach = await generateColdOutreach({
          title: job.job_title,
          company: job.company?.name || "Target Company",
        });

        // 3. Insert into Supabase
        const { data: inserted } = await supabase
          .from("jobs")
          .insert([
            {
              title: job.job_title,
              company: job.company?.name || "Unknown",
              url: job.url,
              location: "Remote (Global)",
              source: "theirstack",
              status: "new",
            },
          ])
          .select()
          .single();

        if (inserted) {
          newLeads.push({ ...inserted, outreach });
        }
      }
    }

    // --- RESEND EMAIL DISPATCH ---
    if (newLeads.length > 0) {
      console.log(`📨 Dispatching ${newLeads.length} TheirStack leads...`);

      await resend.emails.send({
        from: "TheirStack-Intel <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🎯 Global Intercept: ${newLeads.length} Fresh ATS Leads`,
        html: `
          <div style="background: #0f172a; color: #f8fafc; padding: 40px; font-family: sans-serif;">
            <h1 style="color: #38bdf8;">TheirStack Intelligence Report</h1>
            <p>Direct ATS intercepts from the last 24 hours.</p>
            <hr style="border: 1px solid #1e293b; margin: 20px 0;">
            ${newLeads
              .map(
                (j) => `
              <div style="margin-bottom: 30px; border-left: 4px solid #38bdf8; padding-left: 15px;">
                <h2 style="margin: 0;">${j.title}</h2>
                <p style="color: #38bdf8; margin: 5px 0;">${j.company}</p>
                <a href="${j.url}" style="color: #94a3b8; font-size: 12px;">VIEW CAREER PAGE →</a>
                
                <div style="margin-top: 15px; background: #1e293b; padding: 10px; border-radius: 5px;">
                  <strong style="font-size: 11px; color: #7dd3fc;">OUTREACH SCRIPT:</strong>
                  <p style="font-size: 13px; font-family: monospace; color: #cbd5e1;">${j.outreach.email}</p>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `,
      });
    } else {
      console.log("ℹ️ No new unique ATS signals found in the last 24h.");
    }
  } catch (err) {
    console.error("❌ TheirStack Failure:", err.message);
  }
}

scoutTheirStack();
