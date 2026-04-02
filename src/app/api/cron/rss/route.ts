// import { NextResponse } from "next/server";
// import { Resend } from "resend";
// import Parser from "rss-parser";

// const resend = new Resend(process.env.RESEND_API_KEY);
// const parser = new Parser();

// // Updated to the most stable 2026 RSS endpoints
// const FEEDS = [
//   "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
//   "https://remotive.com/feed",
//   "https://remoteok.com/remote-jobs.rss",
//   "https://himalayas.app/jobs/frontend.rss",
//   "https://nodesk.co/remote-jobs/index.xml",
// ];

// export async function GET(request: Request) {
//   const authHeader = request.headers.get("authorization");
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return new Response("Unauthorized", { status: 401 });
//   }

//   const allJobs: any[] = [];
//   const lookbackDate = new Date();
//   lookbackDate.setDate(lookbackDate.getDate() - 3); // 3 days to be safe

//   for (const url of FEEDS) {
//     try {
//       console.log(`Fetching RSS: ${url}`);

//       // Step 1: Use fetch with a User-Agent to bypass bot detection
//       const response = await fetch(url, {
//         headers: {
//           "User-Agent":
//             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//           Accept: "application/rss+xml, application/xml, text/xml",
//         },
//         next: { revalidate: 0 }, // Ensure we don't get cached results
//       });

//       if (!response.ok) throw new Error(`HTTP ${response.status}`);

//       const xml = await response.text();

//       // Step 2: Parse the XML string instead of the URL
//       const feed = await parser.parseString(xml);

//       const items = feed.items.map((item) => ({
//         title: item.title,
//         company: item.creator || item.author || "Remote Board",
//         url: item.link,
//         date: new Date(item.pubDate || item.isoDate || ""),
//       }));

//       allJobs.push(...items);
//     } catch (e: any) {
//       // Log exactly why it failed so we can adjust
//       console.error(`RSS Error for ${url}: ${e.message}`);
//     }
//   }

//   // Final filtering
//   const keywords = [
//     "frontend",
//     "front-end",
//     "react",
//     "typescript",
//     "next.js",
//     "javascript",
//   ];
//   const filtered = allJobs.filter(
//     (j) =>
//       j.date >= lookbackDate &&
//       keywords.some((key) => j.title?.toLowerCase().includes(key)),
//   );

//   // Deduplicate by URL
//   const uniqueJobs = Array.from(
//     new Map(filtered.map((j) => [j.url, j])).values(),
//   );

//   console.log(`RSS Engine: Found ${uniqueJobs.length} fresh jobs`);

//   if (uniqueJobs.length > 0) {
//     await resend.emails.send({
//       from: "JobBot <onboarding@resend.dev>",
//       to: process.env.MY_EMAIL!,
//       subject: `🏹 ${uniqueJobs.length} Niche Remote Jobs Found`,
//       html: `
//         <h2 style="font-family: sans-serif;">Niche Job Board Results</h2>
//         <div style="font-family: sans-serif;">
//           ${uniqueJobs
//             .map(
//               (j) => `
//             <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
//               <strong style="font-size: 16px;">${j.title}</strong><br/>
//               <span style="color: #666;">🏢 ${j.company}</span><br/>
//               <a href="${j.url}" style="color: #0070f3; text-decoration: none;">View Posting →</a>
//             </div>
//           `,
//             )
//             .join("")}
//         </div>
//       `,
//     });
//   }

//   return NextResponse.json({ found: uniqueJobs.length });
// }

import { NextResponse } from "next/server";
import { Resend } from "resend";
import Parser from "rss-parser";

const resend = new Resend(process.env.RESEND_API_KEY);
const parser = new Parser();

const FEEDS = [
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
  "https://remotive.com/remote-jobs/feed", // Updated more stable URL
  "https://remoteok.com/remote-jobs.rss",
  "https://himalayas.app/jobs/frontend/rss", // Correct 2026 RSS path
  "https://nodesk.co/remote-jobs/index.xml",
  "https://himalayas.app/jobs/countries/kenya?q=frontend+developer",
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const allJobs: any[] = [];
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - 3);

  for (const url of FEEDS) {
    try {
      console.log(`Fetching RSS: ${url}`);

      // Using a real browser User-Agent is mandatory in 2026
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        console.error(`Skipping ${url} - Status: ${response.status}`);
        continue;
      }

      const xml = await response.text();
      const feed = await parser.parseString(xml);

      const items = feed.items.map((item) => ({
        title: item.title,
        company: item.creator || item.author || "Remote Board",
        url: item.link,
        date: new Date(item.pubDate || item.isoDate || ""),
      }));

      allJobs.push(...items);
    } catch (e: any) {
      console.error(`RSS Error for ${url}: ${e.message}`);
    }
  }

  const keywords = [
    "frontend",
    "front-end",
    "react",
    "typescript",
    "next.js",
    "javascript",
  ];
  const filtered = allJobs.filter(
    (j) =>
      j.date >= lookbackDate &&
      keywords.some((key) => j.title?.toLowerCase().includes(key)),
  );

  const uniqueJobs = Array.from(
    new Map(filtered.map((j) => [j.url, j])).values(),
  );

  if (uniqueJobs.length > 0) {
    await resend.emails.send({
      from: "JobBot <onboarding@resend.dev>",
      to: process.env.MY_EMAIL!,
      subject: `🏹 ${uniqueJobs.length} Niche Remote Jobs Found`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">Today's Niche Leads</h2>
          ${uniqueJobs
            .map(
              (j) => `
            <div style="padding: 15px; border-bottom: 1px solid #eee;">
              <strong style="font-size: 16px;">${j.title}</strong><br/>
              <span style="color: #666;">🏢 ${j.company}</span><br/>
              <a href="${j.url}" style="color: #0070f3; text-decoration: none; font-weight: bold;">View Details →</a>
            </div>
          `,
            )
            .join("")}
        </div>
      `,
    });
  }

  return NextResponse.json({ found: uniqueJobs.length });
}
