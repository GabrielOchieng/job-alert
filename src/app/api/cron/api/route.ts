// import { NextResponse } from "next/server";
// import { Resend } from "resend";
// import { filterNewJobs } from "@/lib/supabase"; // Make sure this path matches your file structure

// const resend = new Resend(process.env.RESEND_API_KEY);

// const SEARCH_QUERIES = [
//   "react engineer remote global",
//   "nextjs developer remote",
//   "typescript frontend remote",
//   "tailwind css developer remote",
//   "javascript engineer worldwide",
//   "web developer remote anywhere",
// ];

// export async function GET(request: Request) {
//   // Security Check
//   const authHeader = request.headers.get("authorization");
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return new Response("Unauthorized", { status: 401 });
//   }

//   let allJobs: any[] = [];

//   // 1. Fetch from JSearch with Pagination
//   const apiPromises = SEARCH_QUERIES.map(async (query) => {
//     try {
//       const res = await fetch(
//         `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&remote_jobs_only=true&date_posted=3days&page=1&num_pages=2`,
//         {
//           headers: {
//             "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
//             "x-rapidapi-host": "jsearch.p.rapidapi.com",
//           },
//         },
//       );
//       const data = await res.json();
//       return data.data || [];
//     } catch (e) {
//       console.error(`JSearch Error for ${query}:`, e);
//       return [];
//     }
//   });

//   const results = await Promise.all(apiPromises);
//   results.forEach((group) => allJobs.push(...group));

//   // 2. Deduplicate and Map to our internal format
//   const uniqueJobs = Array.from(
//     new Map(
//       allJobs.map((j: any) => [
//         j.job_apply_link,
//         {
//           title: j.job_title,
//           company: j.employer_name,
//           url: j.job_apply_link,
//           // Detect 'Direct' ATS links (Lever, Greenhouse, Workable, Ashby)
//           isDirect: /lever\.co|greenhouse\.io|workable\.com|ashbyhq\.com/.test(
//             j.job_apply_link.toLowerCase(),
//           ),
//         },
//       ]),
//     ).values(),
//   );

//   // 3. THE MAGIC: Filter only the jobs we haven't sent before
//   const newJobs = await filterNewJobs(uniqueJobs);

//   console.log(
//     `Aggregator: ${uniqueJobs.length} found. ${newJobs.length} are new.`,
//   );

//   // 4. Send Email only if there are fresh leads
//   if (newJobs.length > 0) {
//     // Sort so Direct applications are at the top for the email
//     const sorted = newJobs.sort((a: any, b: any) => (b.isDirect ? 1 : -1));

//     await resend.emails.send({
//       from: "JobBot <onboarding@resend.dev>",
//       to: process.env.MY_EMAIL!,
//       subject: `🌍 ${sorted.length} NEW Global Jobs Found`,
//       html: `
//         <div style="font-family: sans-serif; max-width: 600px;">
//           <h2>Fresh Remote Leads</h2>
//           <p>The following jobs were just posted and haven't been sent to you before.</p>
//           <hr />
//           ${sorted
//             .map(
//               (j: any) => `
//             <div style="margin-bottom: 20px;">
//               ${j.isDirect ? "⭐ <strong style='color: #059669;'>DIRECT APPLY</strong><br>" : ""}
//               <strong style="font-size: 1.1em;">${j.title}</strong> @ ${j.company}<br>
//               <a href="${j.url}" style="color: #2563eb; text-decoration: none;">Apply Now →</a>
//             </div>
//           `,
//             )
//             .join("")}
//         </div>
//       `,
//     });
//   }

//   return NextResponse.json({
//     total_found: uniqueJobs.length,
//     new_sent: newJobs.length,
//   });
// }

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { filterNewJobs } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

const SEARCH_QUERIES = [
  "react engineer remote global",
  "nextjs developer remote",
  "typescript frontend remote",
  "tailwind css developer remote",
  "javascript engineer worldwide",
  "web developer remote anywhere",
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let allJobs: any[] = [];

  const apiPromises = SEARCH_QUERIES.map(async (query) => {
    try {
      const res = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&remote_jobs_only=true&date_posted=3days&page=1&num_pages=2`,
        {
          headers: {
            "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
          },
        },
      );
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error(`JSearch Error for ${query}:`, e);
      return [];
    }
  });

  const results = await Promise.all(apiPromises);
  results.forEach((group) => allJobs.push(...group));

  const uniqueJobs = Array.from(
    new Map(
      allJobs.map((j: any) => [
        j.job_apply_link,
        {
          title: j.job_title,
          company: j.employer_name,
          url: j.job_apply_link,
          isDirect: /lever\.co|greenhouse\.io|workable\.com|ashbyhq\.com/.test(
            j.job_apply_link.toLowerCase(),
          ),
        },
      ]),
    ).values(),
  );

  // Filter against DB and save new ones with full metadata
  const newJobs = await filterNewJobs(uniqueJobs);

  console.log(
    `Aggregator: ${uniqueJobs.length} found. ${newJobs.length} are new.`,
  );

  if (newJobs.length > 0) {
    const sorted = newJobs.sort((a: any, b: any) => (b.isDirect ? 1 : -1));

    await resend.emails.send({
      from: "JobBot <onboarding@resend.dev>",
      to: process.env.MY_EMAIL!,
      subject: `🌍 ${sorted.length} NEW Global Jobs Found`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>Fresh Remote Leads</h2>
          <hr />
          ${sorted
            .map(
              (j: any) => `
            <div style="margin-bottom: 20px;">
              ${j.isDirect ? "⭐ <strong style='color: #059669;'>DIRECT APPLY</strong><br>" : ""}
              <strong style="font-size: 1.1em;">${j.title}</strong> @ ${j.company}<br>
              <a href="${j.url}" style="color: #2563eb; text-decoration: none;">Apply Now →</a>
            </div>
          `,
            )
            .join("")}
        </div>
      `,
    });
  }

  return NextResponse.json({
    total_found: uniqueJobs.length,
    new_sent: newJobs.length,
  });
}
