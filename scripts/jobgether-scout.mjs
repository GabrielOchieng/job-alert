// import FirecrawlApp from "@mendable/firecrawl-js";
// import { createClient } from "@supabase/supabase-js";
// import dotenv from "dotenv";

// dotenv.config();

// const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_KEY,
// );

// const TARGET_URL =
//   "https://jobgether.com/remote-jobs/africa/frontend-developer";

// async function scoutJobgether() {
//   console.log(
//     "🌍 [Jobgether Scout] Scanning for Africa-friendly remote roles...",
//   );

//   try {
//     const scrape = await firecrawl.scrape(TARGET_URL, {
//       // 2026 STRICT V2 SYNTAX
//       formats: [
//         {
//           type: "json",
//           prompt:
//             "Extract the list of job postings. For each job, find the title, company name, and the job link.",
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
//                   },
//                   required: ["title", "url"],
//                 },
//               },
//             },
//           },
//         },
//       ],
//       // Use actions to ensure the job cards are rendered
//       actions: [{ type: "wait", milliseconds: 3000 }],
//     });

//     // Detailed error logging
//     if (!scrape.success) {
//       console.error(
//         "❌ Firecrawl API Error Details:",
//         JSON.stringify(scrape, null, 2),
//       );
//       return;
//     }

//     const rawJobs = scrape.json?.jobs || [];
//     console.log(`📡 AI found ${rawJobs.length} raw listings.`);

//     let newSignals = 0;
//     for (const job of rawJobs) {
//       if (/frontend|react|typescript|nextjs|ui/i.test(job.title)) {
//         const fullUrl = job.url.startsWith("http")
//           ? job.url
//           : `https://jobgether.com${job.url}`;

//         const { data: exists } = await supabase
//           .from("jobs")
//           .select("url")
//           .eq("url", fullUrl)
//           .maybeSingle();

//         if (!exists) {
//           const { error } = await supabase.from("jobs").insert([
//             {
//               title: job.title,
//               company: job.company || "Unknown Company",
//               url: fullUrl,
//               location: "Remote (Africa-Friendly)",
//               source: "jobgether",
//               status: "new",
//             },
//           ]);

//           if (!error) {
//             newSignals++;
//             console.log(`✅ Jobgether Lead: ${job.title}`);
//           }
//         }
//       }
//     }

//     console.log(`🏁 Finished. Captured ${newSignals} new roles.`);
//   } catch (err) {
//     // This will now catch "targetUrl is not defined" or other crashes
//     console.error("❌ Fatal Script Crash:", err.message);
//     console.error(err.stack);
//   }
// }

// scoutJobgether();

import FirecrawlApp from "@mendable/firecrawl-js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

const TARGET_URL =
  "https://jobgether.com/remote-jobs/africa/frontend-developer";

async function scoutJobgether() {
  console.log(
    "🌍 [Jobgether Scout] Scanning for Africa-friendly remote roles...",
  );

  try {
    const scrape = await firecrawl.scrape(TARGET_URL, {
      formats: [
        {
          type: "json",
          prompt:
            "Extract the list of job postings. For each job, find the title, company name, and the job link.",
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
                  },
                  required: ["title", "url"],
                },
              },
            },
          },
        },
      ],
      // Removed 'actions' to stop the API warning, replaced with standard wait
      waitFor: 5000,
    });

    // Modified check: If we have the data, it's a success even with a warning
    const rawJobs = scrape.json?.jobs || [];

    if (rawJobs.length === 0) {
      console.error(
        "⚠️ No jobs found. Firecrawl details:",
        JSON.stringify(scrape, null, 2),
      );
      return;
    }

    console.log(`📡 AI successfully extracted ${rawJobs.length} job signals.`);

    let newSignals = 0;
    for (const job of rawJobs) {
      // Logic to filter for Frontend/React
      if (/frontend|react|typescript|nextjs|ui/i.test(job.title)) {
        const fullUrl = job.url.startsWith("http")
          ? job.url
          : `https://jobgether.com${job.url}`;

        const { data: exists } = await supabase
          .from("jobs")
          .select("url")
          .eq("url", fullUrl)
          .maybeSingle();

        if (!exists) {
          const { error } = await supabase.from("jobs").insert([
            {
              title: job.title,
              company: job.company || "Unknown Company",
              url: fullUrl,
              location: "Remote (Africa-Friendly)",
              source: "jobgether",
              status: "new",
            },
          ]);

          if (!error) {
            newSignals++;
            console.log(`✅ New Signal: ${job.title} @ ${job.company}`);
          }
        }
      }
    }

    console.log(
      `🏁 Harvest Complete. Captured ${newSignals} new Africa-friendly leads.`,
    );
  } catch (err) {
    console.error("❌ Fatal Script Crash:", err.message);
  }
}

scoutJobgether();
