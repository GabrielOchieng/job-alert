// import { NextResponse } from "next/server";
// import { Resend } from "resend";
// import Parser from "rss-parser";

// const resend = new Resend(process.env.RESEND_API_KEY);
// const parser = new Parser();

// const FEEDS = [
//   "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
//   "https://remotive.com/remote-jobs/feed", // Updated more stable URL
//   "https://remoteok.com/remote-jobs.rss",
//   "https://himalayas.app/jobs/frontend/rss", // Correct 2026 RSS path
//   "https://nodesk.co/remote-jobs/index.xml",
// ];

// export async function GET(request: Request) {
//   const authHeader = request.headers.get("authorization");
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return new Response("Unauthorized", { status: 401 });
//   }

//   const allJobs: any[] = [];
//   const lookbackDate = new Date();
//   lookbackDate.setDate(lookbackDate.getDate() - 3);

//   for (const url of FEEDS) {
//     try {
//       console.log(`Fetching RSS: ${url}`);

//       // Using a real browser User-Agent is mandatory in 2026
//       const response = await fetch(url, {
//         headers: {
//           "User-Agent":
//             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
//           Accept: "application/rss+xml, application/xml, text/xml",
//           "Cache-Control": "no-cache",
//         },
//       });

//       if (!response.ok) {
//         console.error(`Skipping ${url} - Status: ${response.status}`);
//         continue;
//       }

//       const xml = await response.text();
//       const feed = await parser.parseString(xml);

//       const items = feed.items.map((item) => ({
//         title: item.title,
//         company: item.creator || item.author || "Remote Board",
//         url: item.link,
//         date: new Date(item.pubDate || item.isoDate || ""),
//       }));

//       allJobs.push(...items);
//     } catch (e: any) {
//       console.error(`RSS Error for ${url}: ${e.message}`);
//     }
//   }

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

//   const uniqueJobs = Array.from(
//     new Map(filtered.map((j) => [j.url, j])).values(),
//   );

//   if (uniqueJobs.length > 0) {
//     await resend.emails.send({
//       from: "JobBot <onboarding@resend.dev>",
//       to: process.env.MY_EMAIL!,
//       subject: `🏹 ${uniqueJobs.length} Niche Remote Jobs Found`,
//       html: `
//         <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
//           <h2 style="color: #333;">Today's Niche Leads</h2>
//           ${uniqueJobs
//             .map(
//               (j) => `
//             <div style="padding: 15px; border-bottom: 1px solid #eee;">
//               <strong style="font-size: 16px;">${j.title}</strong><br/>
//               <span style="color: #666;">🏢 ${j.company}</span><br/>
//               <a href="${j.url}" style="color: #0070f3; text-decoration: none; font-weight: bold;">View Details →</a>
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
  // 1. WWR (Still the most stable)
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",

  // 2. Himalayas (Updated 2026 Path)
  "https://himalayas.app/jobs/rss",

  // 3. Remotive (Base feed is more stable than category feeds)
  "https://remotive.com/feed",

  // 4. RemoteOK (Requires the User-Agent header below)
  "https://remoteok.com/remote-jobs.rss",

  // 5. NoDesk (High quality)
  "https://nodesk.co/remote-jobs/index.xml",
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

      const response = await fetch(url, {
        headers: {
          // Standard 2026 browser header to bypass "404" and "403" blocks
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.warn(`Skipping ${url} - Status: ${response.status}`);
        continue;
      }

      const xml = await response.text();
      const feed = await parser.parseString(xml);

      const items = feed.items.map((item) => ({
        title: item.title,
        company: item.creator || item.author || "Remote Company",
        url: item.link,
        date: new Date(item.pubDate || item.isoDate || ""),
      }));

      allJobs.push(...items);
    } catch (e: any) {
      console.error(`RSS Fail for ${url}: ${e.message}`);
    }
  }

  // Refined filtering to include React, Next.js, and TypeScript
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

  console.log(`RSS Engine Summary: ${uniqueJobs.length} fresh jobs found.`);

  if (uniqueJobs.length > 0) {
    await resend.emails.send({
      from: "JobBot <onboarding@resend.dev>",
      to: process.env.MY_EMAIL!,
      subject: `🏹 ${uniqueJobs.length} Niche Remote Roles Found`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #2563eb;">Today's Niche Leads</h2>
          <p>These roles were found on specialist remote boards.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          ${uniqueJobs
            .map(
              (j) => `
            <div style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
              <div style="font-size: 16px; font-weight: bold; color: #111;">${j.title}</div>
              <div style="color: #666; margin: 4px 0;">🏢 ${j.company}</div>
              <a href="${j.url}" style="color: #2563eb; text-decoration: none; font-size: 14px;">Apply on ${j.company} →</a>
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
