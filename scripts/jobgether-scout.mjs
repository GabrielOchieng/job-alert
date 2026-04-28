// import FirecrawlApp from "@mendable/firecrawl-js";
// import { createClient } from "@supabase/supabase-js";
// import { Resend } from "resend";
// import dotenv from "dotenv";
// dotenv.config();

// const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_KEY,
// );
// const resend = new Resend(process.env.RESEND_API_KEY);

// const TARGET_URL =
//   "https://jobgether.com/remote-jobs/africa/frontend-developer";

// async function scoutJobgether() {
//   console.log(
//     "🌍 [Jobgether Scout] Scanning for FRESH Africa-friendly remote roles...",
//   );

//   try {
//     const scrape = await firecrawl.scrape(TARGET_URL, {
//       formats: [
//         {
//           type: "json",
//           prompt:
//             "Extract job postings. For each job, find the title, company name, the job link, and how long ago it was posted (e.g., 'Today', '3 days ago', '30+ days ago').",
//           schema: {
//             type: "object",
//             properties: {
//               jobs: {
//                 type: "array",
//                 items: {
//                   type: "object",
//                   properties: {
//                     title: { type: "string" },
//                     company: { type: "string" },
//                     url: { type: "string" },
//                     posted_date: { type: "string" },
//                   },
//                   required: ["title", "url", "posted_date"],
//                 },
//               },
//             },
//           },
//         },
//       ],
//       waitFor: 5000,
//     });

//     const rawJobs = scrape.json?.jobs || [];
//     const newLeads = [];

//     for (const job of rawJobs) {
//       // 1. Filter: Role must be Frontend/React related
//       const titleMatch = /frontend|react|typescript|nextjs|ui/i.test(job.title);

//       // 2. Filter: Reject stale jobs (30+ days or "month" mentioned)
//       const isTooOld = /30\+|month|31|60|90/i.test(job.posted_date);

//       if (titleMatch && !isTooOld) {
//         const fullUrl = job.url.startsWith("http")
//           ? job.url
//           : `https://jobgether.com${job.url}`;

//         // Check deduplication
//         const { data: existing } = await supabase
//           .from("jobs")
//           .select("url")
//           .eq("url", fullUrl)
//           .maybeSingle();

//         if (!existing) {
//           const { data: inserted, error: insertError } = await supabase
//             .from("jobs")
//             .insert([
//               {
//                 title: job.title,
//                 company: job.company || "Unknown",
//                 url: fullUrl,
//                 location: `Remote (${job.posted_date})`,
//                 source: "jobgether",
//                 status: "new",
//               },
//             ])
//             .select()
//             .single();

//           if (inserted) {
//             newLeads.push(inserted);
//             console.log(`✅ Fresh Signal: ${job.title} @ ${job.company}`);
//           }
//         }
//       }
//     }

//     // --- RESEND EMAIL BLOCK ---
//     if (newLeads.length > 0) {
//       console.log(
//         `📧 Dispatching ${newLeads.length} leads to email via Resend...`,
//       );

//       const { data, error } = await resend.emails.send({
//         from: "Jobgether-Alerts <onboarding@resend.dev>",
//         to: process.env.MY_EMAIL,
//         subject: `🌍 Jobgether: ${newLeads.length} New Africa-Friendly Roles`,
//         html: `
//           <div style="background: #020617; color: #f8fafc; padding: 40px; font-family: sans-serif; border-top: 4px solid #10b981;">
//             <h1 style="color: #10b981; font-size: 20px; text-transform: uppercase;">Jobgether Africa Intel</h1>
//             <p style="color: #94a3b8;">Fresh remote opportunities detected in your region.</p>
//             <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;">
//             ${newLeads
//               .map(
//                 (j) => `
//               <div style="margin-bottom: 20px; background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #1e293b;">
//                 <div style="font-size: 16px; font-weight: bold;">${j.title}</div>
//                 <div style="color: #10b981; margin: 4px 0;">${j.company}</div>
//                 <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">${j.location}</div>
//                 <a href="${j.url}" style="color: white; background: #10b981; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px;">VIEW ROLE →</a>
//               </div>
//             `,
//               )
//               .join("")}
//           </div>
//         `,
//       });

//       if (error) console.error("❌ Resend Error:", error.message);
//       else console.log("📨 Email dispatched successfully!");
//     } else {
//       console.log("ℹ️ No new fresh signals found this run.");
//     }
//   } catch (err) {
//     console.error("❌ Jobgether Scout Failure:", err.message);
//   }
// }

// scoutJobgether();

import FirecrawlApp from "@mendable/firecrawl-js";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { generateColdOutreach } from "./outreach-generator.mjs"; // Imported your logic
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
    const newLeads = [];

    for (const job of rawJobs) {
      const titleMatch = /frontend|react|typescript|nextjs|ui/i.test(job.title);
      const isTooOld = /30\+|month|31|60|90/i.test(job.posted_date);

      if (titleMatch && !isTooOld) {
        const fullUrl = job.url.startsWith("http")
          ? job.url
          : `https://jobgether.com${job.url}`;

        const { data: existing } = await supabase
          .from("jobs")
          .select("url")
          .eq("url", fullUrl)
          .maybeSingle();

        if (!existing) {
          // 1. Generate outreach using your separate file logic
          console.log(`🤖 Decrypting Outreach Strategy for: ${job.company}...`);
          const outreach = await generateColdOutreach(job);

          // 2. Insert into Command Center
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
            newLeads.push({ ...inserted, outreach });
            console.log(`✅ Fresh Signal Saved: ${job.title}`);
          }
        }
      }
    }

    // --- RESEND DISPATCH ---
    if (newLeads.length > 0) {
      console.log(
        `📨 Dispatching Intelligence Report: ${newLeads.length} leads.`,
      );

      const { data, error } = await resend.emails.send({
        from: "Jobgether-Intel <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🌍 Jobgether: ${newLeads.length} Roles + Battle Scripts`,
        html: `
          <div style="background: #020617; color: #f8fafc; padding: 40px; font-family: sans-serif; border-top: 4px solid #10b981;">
            <h1 style="color: #10b981; font-size: 20px; text-transform: uppercase;">Africa Region Intelligence</h1>
            <p style="color: #94a3b8;">Fresh remote opportunities with generated outreach scripts.</p>
            
            ${newLeads
              .map(
                (j) => `
              <div style="margin-top: 25px; background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #1e293b;">
                <div style="font-size: 18px; font-weight: bold; color: #f8fafc;">${j.title}</div>
                <div style="color: #10b981; font-weight: 600; margin: 5px 0;">${j.company}</div>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 15px;">Status: ${j.location}</div>
                
                <a href="${j.url}" style="display: inline-block; background: #10b981; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: bold;">OPEN JOB →</a>
                
                <div style="margin-top: 20px; border-top: 1px solid #1e293b; padding-top: 15px;">
                   <p style="font-size: 11px; color: #3b82f6; text-transform: uppercase; margin: 0 0 8px 0;">LinkedIn Script:</p>
                   <div style="background: #020617; padding: 12px; border-radius: 6px; font-size: 13px; font-family: monospace; color: #cbd5e1; border: 1px dashed #1e293b;">${j.outreach.linkedin}</div>
                   
                   <p style="font-size: 11px; color: #10b981; text-transform: uppercase; margin: 15px 0 8px 0;">Cold Email / DM:</p>
                   <div style="background: #020617; padding: 12px; border-radius: 6px; font-size: 13px; font-family: monospace; color: #cbd5e1; border: 1px dashed #1e293b;">${j.outreach.email}</div>
                </div>
              </div>
            `,
              )
              .join("")}
            
            <p style="font-size: 10px; color: #475569; margin-top: 40px; text-align: center;">Cipher Hunt Region Agent v2.1</p>
          </div>
        `,
      });

      if (error) console.error("❌ Resend Error:", error.message);
      else console.log("📨 Intelligence email dispatched!");
    } else {
      console.log("ℹ️ No new fresh signals detected.");
    }
  } catch (err) {
    console.error("❌ Jobgether Scout Failure:", err.message);
  }
}

scoutJobgether();
