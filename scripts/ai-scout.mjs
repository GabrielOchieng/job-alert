// // scripts/ai-scout.mjs
// import FirecrawlApp from "@mendable/firecrawl-js";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { createClient } from "@supabase/supabase-js";
// import { Resend } from "resend";
// import dotenv from "dotenv";

// dotenv.config();

// const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY,
// );
// const resend = new Resend(process.env.RESEND_API_KEY);

// const SOURCES = [
//   "https://weworkremotely.com/categories/remote-front-end-programming-jobs",
//   "https://himalayas.app/jobs/remote/worldwide",
//   "https://nodesk.co/remote-jobs/engineering/",
// ];

// async function run() {
//   const targetUrl = SOURCES[Math.floor(Math.random() * SOURCES.length)];
//   console.log(`🚀 Starting AI Scout on: ${targetUrl}`);

//   try {
//     const scrapeResult = await firecrawl.scrape(targetUrl, {
//       formats: ["markdown"],
//       waitFor: 3000,
//     });
//     const model = genAI.getGenerativeModel({
//       model: "gemini-3.1-flash-lite-preview",
//     });

//     const prompt = `Extract a JSON list of jobs from this markdown. ONLY 100% WORLDWIDE REMOTE Software Engineering roles. Format: [{"title": "...", "company": "...", "url": "..."}] \n\n Content: ${scrapeResult.markdown}`;

//     const aiResult = await model.generateContent(prompt);
//     const jobs = JSON.parse(
//       aiResult.response
//         .text()
//         .replace(/```json|```/g, "")
//         .trim(),
//     );

//     console.log(
//       `Found ${jobs.length} potential leads. Syncing with Supabase...`,
//     );

//     const newLeads = [];
//     for (const job of jobs) {
//       const { data } = await supabase
//         .from("jobs")
//         .select("url")
//         .eq("url", job.url)
//         .single();
//       if (!data) {
//         const { data: inserted } = await supabase
//           .from("jobs")
//           .insert([job])
//           .select()
//           .single();
//         if (inserted) newLeads.push(inserted);
//       }
//     }

//     if (newLeads.length > 0) {
//       await resend.emails.send({
//         from: "JobBot <onboarding@resend.dev>",
//         to: process.env.MY_EMAIL,
//         subject: `✨ GitHub Scout: ${newLeads.length} Global Leads`,
//         html: `<h2>New Leads Found</h2>${newLeads.map((j) => `<p><strong>${j.title}</strong> @ ${j.company}<br><a href="${j.url}">Apply →</a></p>`).join("")}`,
//       });
//       console.log("✅ Email sent!");
//     }
//   } catch (err) {
//     console.error("❌ Error:", err.message);
//     process.exit(1);
//   }
// }

// run();

// scripts/ai-scout.mjs
import FirecrawlApp from "@mendable/firecrawl-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Note: GitHub Actions injects env variables directly,
// so we don't strictly need dotenv.config() here.

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const resend = new Resend(process.env.RESEND_API_KEY);

const SOURCES = [
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs",
  "https://himalayas.app/jobs/remote/worldwide",
  "https://nodesk.co/remote-jobs/engineering/",
];

async function run() {
  const targetUrl = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  console.log(`🚀 Starting AI Scout on: ${targetUrl}`);

  try {
    // 1. SCRAPE
    const scrapeResult = await firecrawl.scrape(targetUrl, {
      formats: ["markdown"],
      waitFor: 3000,
    });

    if (!scrapeResult.markdown)
      throw new Error("Scrape failed to return content.");

    const prompt = `Extract a JSON list of jobs from this markdown. 
    ONLY 100% WORLDWIDE REMOTE Software Engineering roles. 
    Format: [{"title": "...", "company": "...", "url": "..."}] 
    
    Content: ${scrapeResult.markdown}`;

    // 2. AI PROCESSING WITH FALLBACK
    let aiResponseText = "";

    try {
      console.log("Attempting Primary Model: gemini-1.5-flash-latest");
      const primaryModel = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
      });
      const result = await primaryModel.generateContent(prompt);
      aiResponseText = result.response.text();
    } catch (primaryError) {
      console.error(
        "Primary Model Failed. Attempting Fallback: gemini-1.5-pro-latest",
      );
      // Fallback to Pro if Flash is having issues, or vice-versa
      const fallbackModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      const result = await fallbackModel.generateContent(prompt);
      aiResponseText = result.response.text();
    }

    // 3. PARSE & SYNC
    const jobs = JSON.parse(aiResponseText.replace(/```json|```/g, "").trim());
    console.log(`Found ${jobs.length} potential leads. Checking Supabase...`);

    const newLeads = [];
    for (const job of jobs) {
      // Check if URL exists
      const { data: existing } = await supabase
        .from("jobs")
        .select("url")
        .eq("url", job.url)
        .maybeSingle();

      if (!existing) {
        const { data: inserted, error: insertError } = await supabase
          .from("jobs")
          .insert([job])
          .select()
          .single();

        if (inserted) {
          newLeads.push(inserted);
        } else if (insertError) {
          console.error(`Insert Error for ${job.title}:`, insertError.message);
        }
      }
    }

    // 4. EMAIL RESULTS
    if (newLeads.length > 0) {
      await resend.emails.send({
        from: "JobBot <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `✨ AI Scout: ${newLeads.length} New Global Leads`,
        html: `
          <div style="font-family: sans-serif;">
            <h2>Fresh Worldwide Leads</h2>
            <p>Scraped from: ${targetUrl}</p>
            <hr />
            ${newLeads
              .map(
                (j) => `
              <div style="margin-bottom: 15px;">
                <strong>${j.title}</strong> @ ${j.company}<br>
                <a href="${j.url}">View Position →</a>
              </div>
            `,
              )
              .join("")}
          </div>
        `,
      });
      console.log(`✅ Success! ${newLeads.length} new jobs saved and emailed.`);
    } else {
      console.log("ℹ️ No new jobs found this run.");
    }
  } catch (err) {
    console.error("❌ Critical Scout Failure:", err.message);
    process.exit(1);
  }
}

run();
