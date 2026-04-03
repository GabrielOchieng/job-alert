// // // src/app/api/jobs/ai-scout/route.ts
// // import { NextResponse } from "next/server";
// // import FirecrawlApp from "@mendable/firecrawl-js";
// // import { GoogleGenerativeAI } from "@google/generative-ai";
// // import { filterNewJobs } from "@/lib/supabase";

// // export const maxDuration = 60;

// // const firecrawl = new FirecrawlApp({
// //   apiKey: process.env.FIRECRAWL_API_KEY,
// // });

// // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// // export async function GET(req: Request) {
// //   // Target a "High-Signal" worldwide source
// //   //   const targetUrl = "https://remoteok.com/remote-frontend-jobs";

// //   const SOURCES = [
// //     "https://remoteok.com/remote-frontend-jobs",
// //     "https://weworkremotely.com/categories/remote-front-end-programming-jobs",
// //     "https://himalayas.app/jobs/remote/worldwide",
// //     "https://nodesk.co/remote-jobs/engineering/",
// //   ];

// //   // Inside your GET function:
// //   const targetUrl = SOURCES[Math.floor(Math.random() * SOURCES.length)];

// //   try {
// //     // 1. Scrape the page using the correct .scrape method
// //     // This returns a ScrapeResponse which contains the document
// //     const scrapeResult = await firecrawl.scrape(targetUrl, {
// //       formats: ["markdown"],
// //       waitFor: 3000, // Wait 3 seconds for the jobs to pop up
// //       mobile: true, // Sometimes mobile views have less bot protection
// //     });

// //     // Access markdown directly from the result
// //     const markdown = scrapeResult.markdown;

// //     if (!markdown) {
// //       throw new Error("No markdown content retrieved from the target URL.");
// //     }

// //     // 2. Setup Gemini
// //     const model = genAI.getGenerativeModel({
// //       model: "gemini-3.1-flash-lite-preview",
// //     });

// //     const prompt = `
// //   Analyze this Markdown from a job board.
// //   Extract jobs into a JSON array: [{"title": "string", "company": "string", "url": "string"}]

// //   CRITERIA:
// //   - Keep jobs tagged as "Worldwide", "Global", or "Anywhere".
// //   - REJECT jobs that explicitly mention "US Only", "Europe Only", or "UK Only".
// //   - If a job has NO geographic restriction mentioned, assume it is Worldwide and KEEP it.
// //   - Return ONLY the JSON array.

// //   CONTENT:
// //   ${markdown}
// // `;

// //     const aiResult = await model.generateContent(prompt);
// //     const text = aiResult.response.text();

// //     // Clean potential markdown blocks from AI response
// //     const cleanedJson = text.replace(/```json|```/g, "").trim();
// //     const extractedJobs = JSON.parse(cleanedJson);

// //     // 3. Save to Supabase (uses your existing filterNewJobs logic)
// //     const newJobs = await filterNewJobs(extractedJobs);

// //     return NextResponse.json({
// //       success: true,
// //       found_total: extractedJobs.length,
// //       new_leads: newJobs.length,
// //       jobs: newJobs,
// //     });
// //   } catch (error: any) {
// //     console.error("AI Scout Error:", error.message);
// //     return NextResponse.json(
// //       {
// //         success: false,
// //         error: error.message,
// //       },
// //       { status: 500 },
// //     );
// //   }
// // }

// // src/app/api/jobs/ai-scout/route.ts
// import { NextResponse } from "next/server";
// import FirecrawlApp from "@mendable/firecrawl-js";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { filterNewJobs } from "@/lib/supabase";

// export const maxDuration = 60; // Essential for scraping + LLM

// const firecrawl = new FirecrawlApp({
//   apiKey: process.env.FIRECRAWL_API_KEY,
// });

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// const SOURCES = [
//   "https://remoteok.com/remote-frontend-jobs",
//   "https://weworkremotely.com/categories/remote-front-end-programming-jobs",
//   "https://himalayas.app/jobs/remote/worldwide",
//   "https://nodesk.co/remote-jobs/engineering/",
// ];

// // Helper to clean and parse AI response
// function parseAIResponse(text: string) {
//   const cleanedJson = text.replace(/```json|```/g, "").trim();
//   return JSON.parse(cleanedJson);
// }

// export async function GET(req: Request) {
//   const authHeader = req.headers.get("authorization");
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return new Response("Unauthorized", { status: 401 });
//   }

//   const targetUrl = SOURCES[Math.floor(Math.random() * SOURCES.length)];

//   try {
//     // 1. SCRAPE
//     const scrapeResult = await firecrawl.scrape(targetUrl, {
//       formats: ["markdown"],
//       waitFor: 3000,
//       mobile: true,
//     });

//     const markdown = scrapeResult.markdown;
//     if (!markdown || markdown.length < 500) {
//       throw new Error(
//         `Scrape returned insufficient content (${markdown?.length || 0} chars).`,
//       );
//     }

//     const prompt = `
//       Analyze this Markdown from a job board.
//       Extract jobs into a JSON array: [{"title": "string", "company": "string", "url": "string"}]

//       CRITERIA:
//       - ONLY keep Software Engineering/Frontend/Fullstack roles.
//       - Keep jobs tagged as "Worldwide", "Global", or "Anywhere".
//       - REJECT "US Only", "Europe Only", or "UK Only".
//       - If no restriction is mentioned, assume Worldwide and KEEP.
//       - Return ONLY the raw JSON array.

//       CONTENT:
//       ${markdown}
//     `;

//     // 2. AI PROCESSING WITH FALLBACK
//     let extractedJobs = [];

//     try {
//       // Primary Attempt: Use the Preview/High-Performance Model
//       console.log("Attempting Primary Model...");
//       const primaryModel = genAI.getGenerativeModel({
//         model: "gemini-2.5-flash",
//       }); // Stable high-speed
//       const result = await primaryModel.generateContent(prompt);
//       extractedJobs = parseAIResponse(result.response.text());
//     } catch (primaryError) {
//       console.error(
//         "Primary Model Failed, switching to Fallback:",
//         primaryError,
//       );

//       // Fallback Attempt: Use the standard 1.5 Flash
//       const fallbackModel = genAI.getGenerativeModel({
//         model: "gemini-3.1-flash-lite-preview",
//       }); // Even faster/cheaper
//       const result = await fallbackModel.generateContent(prompt);
//       extractedJobs = parseAIResponse(result.response.text());
//     }

//     // 3. DATABASE SYNC
//     const newJobs = await filterNewJobs(extractedJobs);

//     return NextResponse.json({
//       success: true,
//       source: targetUrl,
//       found_total: extractedJobs.length,
//       new_leads: newJobs.length,
//       jobs: newJobs,
//     });
//   } catch (error: any) {
//     console.error("AI Scout Critical Failure:", error.message);
//     return NextResponse.json(
//       { success: false, error: error.message },
//       { status: 500 },
//     );
//   }
// }

// src/app/api/jobs/ai-scout/route.ts
import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { filterNewJobs } from "@/lib/supabase";
import { Resend } from "resend"; // 1. Import Resend

export const maxDuration = 60;

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY); // 2. Initialize Resend

const SOURCES = [
  "https://remoteok.com/remote-frontend-jobs",
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs",
  "https://himalayas.app/jobs/remote/worldwide",
  "https://nodesk.co/remote-jobs/engineering/",
];

function parseAIResponse(text: string) {
  const cleanedJson = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanedJson);
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const targetUrl = SOURCES[Math.floor(Math.random() * SOURCES.length)];

  try {
    // 1. SCRAPE
    const scrapeResult = await firecrawl.scrape(targetUrl, {
      formats: ["markdown"],
      waitFor: 3000,
      mobile: true,
    });

    const markdown = scrapeResult.markdown;
    if (!markdown || markdown.length < 500) {
      throw new Error(
        `Scrape returned insufficient content (${markdown?.length || 0} chars).`,
      );
    }

    const prompt = `
      Analyze this Markdown from a job board. 
      Extract jobs into a JSON array: [{"title": "string", "company": "string", "url": "string"}]
      ... (rest of your prompt)
    `;

    // 2. AI PROCESSING
    let extractedJobs = [];
    try {
      console.log("Attempting Primary Model...");
      const primaryModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      const result = await primaryModel.generateContent(prompt);
      extractedJobs = parseAIResponse(result.response.text());
    } catch (primaryError) {
      console.error("Primary Model Failed, switching to Fallback.");
      const fallbackModel = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
      });
      const result = await fallbackModel.generateContent(prompt);
      extractedJobs = parseAIResponse(result.response.text());
    }

    // 3. DATABASE SYNC
    const newJobs = await filterNewJobs(extractedJobs);

    // 4. SEND EMAIL (This was the missing piece!)
    if (newJobs.length > 0) {
      await resend.emails.send({
        from: "JobBot <onboarding@resend.dev>",
        to: process.env.MY_EMAIL!,
        subject: `✨ AI Scout: ${newJobs.length} Global Leads Found`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>AI Scout - High Signal Results</h2>
            <p>Source: ${targetUrl}</p>
            <hr />
            ${newJobs
              .map(
                (j: any) => `
              <div style="margin-bottom: 20px;">
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
      success: true,
      found_total: extractedJobs.length,
      new_leads: newJobs.length,
    });
  } catch (error: any) {
    console.error("AI Scout Critical Failure:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
