// import FirecrawlApp from "@mendable/firecrawl-js";
// import { createClient } from "@supabase/supabase-js";
// import { Resend } from "resend";
// import { generateColdOutreach } from "./outreach-generator.mjs";
// import dotenv from "dotenv";
// dotenv.config();

// const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_KEY,
// );
// const resend = new Resend(process.env.RESEND_API_KEY);

// // Targeted URL for the EU job board
// const TARGET_URL = "https://www.eu-startups.com/jobs/";

// async function scoutEUTech() {
//   console.log("🇪🇺 [EU-Startups Scout] Intercepting European Tech leads...");

//   try {
//     const scrape = await firecrawl.scrape(TARGET_URL, {
//       formats: [
//         {
//           type: "json",
//           prompt:
//             "Extract a list of frontend, react, or fullstack developer jobs. For each job, find the title, company name, location/remote status, and the direct link to the job.",
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
//                     remote_info: { type: "string" },
//                   },
//                   required: ["title", "url"],
//                 },
//               },
//             },
//           },
//         },
//       ],
//       waitFor: 4000,
//     });

//     const rawJobs = scrape.json?.jobs || [];
//     const newLeads = [];

//     for (const job of rawJobs) {
//       // Strategy: Prioritize 'Remote', 'Anywhere', or 'Africa' mentions
//       const isRemote =
//         /remote|anywhere|africa|worldwide|emea/i.test(job.remote_info || "") ||
//         /remote/i.test(job.title);

//       const isFrontend = /frontend|react|typescript|nextjs|javascript/i.test(
//         job.title,
//       );

//       if (isFrontend && isRemote) {
//         const { data: existing } = await supabase
//           .from("jobs")
//           .select("url")
//           .eq("url", job.url)
//           .maybeSingle();

//         if (!existing) {
//           console.log(`🤖 Generating Euro-outreach for: ${job.company}...`);
//           const outreach = await generateColdOutreach(job);

//           const { data: inserted } = await supabase
//             .from("jobs")
//             .insert([
//               {
//                 title: job.title,
//                 company: job.company || "EU Startup",
//                 url: job.url,
//                 location: job.remote_info || "Remote (Europe Sync)",
//                 source: "eu-startups",
//                 status: "new",
//               },
//             ])
//             .select()
//             .single();

//           if (inserted) {
//             newLeads.push({ ...inserted, outreach });
//           }
//         }
//       }
//     }

//     // --- EMAIL DISPATCH ---
//     if (newLeads.length > 0) {
//       await resend.emails.send({
//         from: "EU-Startups-Intel <onboarding@resend.dev>",
//         to: process.env.MY_EMAIL,
//         subject: `🇪🇺 Euro-Signals: ${newLeads.length} High-Sync Roles Found`,
//         html: `
//           <div style="background: #003399; color: #ffffff; padding: 40px; font-family: sans-serif; border-top: 4px solid #ffcc00;">
//             <h1 style="color: #ffcc00; font-size: 22px;">European Startup Intelligence</h1>
//             <p style="color: #e2e8f0;">Roles matched for Nairobi Timezone (GMT+3).</p>
//             ${newLeads
//               .map(
//                 (j) => `
//               <div style="margin-top: 20px; background: #ffffff; color: #1e293b; padding: 20px; border-radius: 8px;">
//                 <h3 style="margin: 0; color: #003399;">${j.title}</h3>
//                 <p><strong>Company:</strong> ${j.company} | <strong>Status:</strong> ${j.location}</p>
//                 <a href="${j.url}" style="color: #003399; font-weight: bold;">VIEW LEAD →</a>

//                 <div style="margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 13px;">
//                   <p style="color: #64748b;"><strong>LinkedIn Connect:</strong><br>${j.outreach.linkedin}</p>
//                   <p style="color: #64748b;"><strong>Email/DM Draft:</strong><br>${j.outreach.email}</p>
//                 </div>
//               </div>
//             `,
//               )
//               .join("")}
//           </div>
//         `,
//       });
//       console.log(`📨 ${newLeads.length} Euro-leads dispatched.`);
//     }
//   } catch (err) {
//     console.error("❌ EU Scout Failure:", err.message);
//   }
// }

// scoutEUTech();

import FirecrawlApp from "@mendable/firecrawl-js";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { generateColdOutreach } from "./outreach-generator.mjs";
import dotenv from "dotenv";
dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);
const resend = new Resend(process.env.RESEND_API_KEY);

const TARGET_URL = "https://www.eu-startups.com/jobs/";

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
    const newLeads = [];

    for (const job of rawJobs) {
      // 1. FRESHNESS FILTER: Reject jobs older than 7 days or tagged as "30+ days"
      // EU-Startups often marks old jobs with "1 month ago" or "3 weeks ago"
      const isTooOld = /week|month|30\+|14|21/i.test(job.posted_at);
      const isFrontend = /frontend|react|typescript|next|javascript/i.test(
        job.title,
      );

      if (isFrontend && !isTooOld) {
        const { data: existing } = await supabase
          .from("jobs")
          .select("url")
          .eq("url", job.url)
          .maybeSingle();

        if (!existing) {
          console.log(
            `✅ Fresh Euro-Lead Found: ${job.title} (${job.posted_at})`,
          );

          const outreach = await generateColdOutreach(job);

          const { data: inserted } = await supabase
            .from("jobs")
            .insert([
              {
                title: job.title,
                company: job.company || "EU Startup",
                url: job.url,
                location: `Remote (Posted: ${job.posted_at})`,
                source: "eu-startups",
                status: "new",
              },
            ])
            .select()
            .single();

          if (inserted) {
            newLeads.push({ ...inserted, outreach });
          }
        }
      } else if (isTooOld) {
        console.log(`⏩ Skipping stale job: ${job.title} (${job.posted_at})`);
      }
    }

    if (newLeads.length > 0) {
      await resend.emails.send({
        from: "EU-Startups-Intel <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🇪🇺 ${newLeads.length} FRESH Euro-Signals Found`,
        html: `
          <div style="background: #003399; color: #ffffff; padding: 40px; font-family: sans-serif; border-top: 4px solid #ffcc00;">
            <h1 style="color: #ffcc00; font-size: 22px;">European Startup Intelligence</h1>
            <p style="color: #e2e8f0;">Roles matched for Nairobi Timezone (GMT+3).</p>
            ${newLeads
              .map(
                (j) => `
              <div style="margin-top: 20px; background: #ffffff; color: #1e293b; padding: 20px; border-radius: 8px;">
                <h3 style="margin: 0; color: #003399;">${j.title}</h3>
                <p><strong>Company:</strong> ${j.company} | <strong>Status:</strong> ${j.location}</p>
                <a href="${j.url}" style="color: #003399; font-weight: bold;">VIEW LEAD →</a>
                
                <div style="margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 13px;">
                  <p style="color: #64748b;"><strong>LinkedIn Connect:</strong><br>${j.outreach.linkedin}</p>
                  <p style="color: #64748b;"><strong>Email/DM Draft:</strong><br>${j.outreach.email}</p>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `,
      });
    }
  } catch (err) {
    console.error("❌ EU Scout Failure:", err.message);
  }
}

scoutEUTech();
