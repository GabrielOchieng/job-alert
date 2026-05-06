// import axios from "axios";
// import { createClient } from "@supabase/supabase-js";
// import { Resend } from "resend";
// import { generateColdOutreach } from "./outreach-generator.mjs";
// import dotenv from "dotenv";
// dotenv.config();

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_KEY,
// );
// const resend = new Resend(process.env.RESEND_API_KEY);

// async function scoutTheirStack() {
//   console.log("🕵️‍♂️ [TheirStack Intercept] Querying Global Job Engine...");

//   try {
//     // CHANGE: Use axios.post instead of axios.get
//     const response = await axios.post(
//       "https://api.theirstack.com/v1/jobs/search",
//       {
//         // CHANGE: Parameters now go directly in the body object
//         job_title_or: ["Frontend Engineer", "React Developer"],
//         remote: true,
//         posted_at_max_age_days: 1, // Cleaner way to get last 24h
//         limit: 20,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.THEIRSTACK_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       },
//     );

//     // TheirStack returns data in response.data.data
//     const jobs = response.data.data || [];
//     const newLeads = [];

//     for (const job of jobs) {
//       // Deduplication using the direct job URL
//       const { data: existing } = await supabase
//         .from("jobs")
//         .select("url")
//         .eq("url", job.url)
//         .maybeSingle();

//       if (!existing) {
//         console.log(`🤖 Intelligence Sync: ${job.company_name || "Target"}`);

//         const outreach = await generateColdOutreach({
//           title: job.job_title,
//           company: job.company_name,
//         });

//         const { data: inserted } = await supabase
//           .from("jobs")
//           .insert([
//             {
//               title: job.job_title,
//               company: job.company_name || "Unknown",
//               url: job.url,
//               location: "Remote (Global)",
//               source: "theirstack",
//               status: "new",
//             },
//           ])
//           .select()
//           .single();

//         if (inserted) newLeads.push({ ...inserted, outreach });
//       }
//     }

//     if (newLeads.length > 0) {
//       console.log(`📨 ${newLeads.length} leads found. Sending email...`);
//       // [Your Resend Email Logic Here]
//     } else {
//       console.log("ℹ️ No new unique signals found.");
//     }
//   } catch (err) {
//     // Helpful debug: see what the server actually said
//     console.error("❌ TheirStack Failure:", err.response?.data || err.message);
//   }
// }

// scoutTheirStack();

import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);
const resend = new Resend(process.env.RESEND_API_KEY);

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
    const newLeads = [];

    for (const job of jobs) {
      // Deduplication using the direct job URL
      const { data: existing } = await supabase
        .from("jobs")
        .select("url")
        .eq("url", job.url)
        .maybeSingle();

      if (!existing) {
        console.log(
          `✅ New Signal Found: ${job.job_title} @ ${job.company_name || "Target"}`,
        );

        const { data: inserted } = await supabase
          .from("jobs")
          .insert([
            {
              title: job.job_title,
              company: job.company_name || "Unknown",
              url: job.url,
              location: "Remote (Global)",
              source: "theirstack",
              status: "new",
            },
          ])
          .select()
          .single();

        if (inserted) {
          newLeads.push(inserted);
        }
      }
    }

    if (newLeads.length > 0) {
      console.log(`📨 ${newLeads.length} leads found. Dispatching email...`);

      await resend.emails.send({
        from: "TheirStack-Intel <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🎯 TheirStack: ${newLeads.length} New Global Roles`,
        html: `
          <div style="background: #020617; color: #f8fafc; padding: 40px; font-family: sans-serif;">
            <h1 style="color: #38bdf8;">TheirStack Daily Intercept</h1>
            <p>Fresh ATS leads for Frontend & React roles.</p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;">
            ${newLeads
              .map(
                (j) => `
              <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; border: 1px solid #1e293b; background: #0f172a;">
                <div style="font-weight: bold; font-size: 16px;">${j.title}</div>
                <div style="color: #38bdf8; margin: 5px 0;">${j.company}</div>
                <a href="${j.url}" style="color: #f8fafc; background: #38bdf8; padding: 5px 10px; text-decoration: none; border-radius: 4px; font-size: 12px; display: inline-block; margin-top: 10px;">VIEW APPLICATION →</a>
              </div>
            `,
              )
              .join("")}
          </div>
        `,
      });
      console.log("📨 Email sent successfully!");
    } else {
      console.log("ℹ️ No new unique signals found.");
    }
  } catch (err) {
    console.error("❌ TheirStack Failure:", err.response?.data || err.message);
  }
}

scoutTheirStack();
