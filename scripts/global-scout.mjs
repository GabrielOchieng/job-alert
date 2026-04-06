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
//   process.env.SUPABASE_KEY,
// );
// const resend = new Resend(process.env.RESEND_API_KEY);

// async function runGlobalScout() {
//   console.log(
//     "🌐 [Cipher Hunt] Initiating Global Board Intercept (Non-API)...",
//   );

//   // This query targets the "Big Three" ATS platforms where 80% of tech startups post
//   const query = `(site:lever.co OR site:greenhouse.io OR site:ashbyhq.com) "frontend" "remote" "apply" after:2026-04-01`;
//   const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

//   try {
//     const scrapeResult = await firecrawl.scrape(targetUrl, {
//       formats: ["markdown"],
//       waitFor: 3000,
//     });

//     if (!scrapeResult.markdown) throw new Error("Global feed empty.");

//     const today = new Date().toDateString();
//     const prompt = `
//       CONTEXT: Today is ${today}.
//       Analyze this Markdown of Google Search results.
//       Extract a JSON list of ACTIVE jobs: [{"title": "string", "company": "string", "url": "string"}]

//       RULES:
//       1. ONLY extract if the link is a direct application page (lever.co/..., greenhouse.io/..., etc).
//       2. REJECT general 'careers' pages; we want specific JOB postings.
//       3. Identify the company name from the URL or snippet text.
//       4. Return ONLY a raw JSON array.
//     `;

//     const model = genAI.getGenerativeModel({
//       model: "gemini-3.1-flash-lite-preview",
//     });
//     const result = await model.generateContent([prompt, scrapeResult.markdown]);
//     const aiText = result.response
//       .text()
//       .replace(/```json|```/g, "")
//       .trim();

//     const jobs = JSON.parse(aiText);
//     console.log(`📡 Decoded ${jobs.length} global signals.`);

//     const newLeads = [];
//     for (const job of jobs) {
//       const { data: existing } = await supabase
//         .from("jobs")
//         .select("url")
//         .eq("url", job.url)
//         .maybeSingle();

//       if (!existing) {
//         const { data: inserted } = await supabase
//           .from("jobs")
//           .insert([
//             {
//               ...job,
//               location: "Remote (Global Feed)",
//               description: `High-signal lead detected via Global Pivot for ${job.title}`,
//               status: "new",
//             },
//           ])
//           .select()
//           .single();

//         if (inserted) newLeads.push(inserted);
//       }
//     }

//     if (newLeads.length > 0) {
//       console.log(`✅ Success! ${newLeads.length} global leads synced.`);
//       // Optional: Send a different-themed email for "Global" vs "X" leads
//     }
//   } catch (err) {
//     console.error("❌ Global Pivot Failure:", err.message);
//   }
// }

// runGlobalScout();

import FirecrawlApp from "@mendable/firecrawl-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);
const resend = new Resend(process.env.RESEND_API_KEY);

async function runGlobalScout() {
  console.log("🌐 [Cipher Hunt] Initiating Global Board Intercept...");

  // Search for direct job board links (lever, greenhouse, ashby) indexed in the last 24h
  const query = `(site:lever.co OR site:greenhouse.io OR site:ashbyhq.com) "frontend" "remote" "apply"`;
  const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbs=qdr:d`;

  try {
    const scrapeResult = await firecrawl.scrape(targetUrl, {
      formats: ["markdown"],
      waitFor: 3000,
    });

    if (!scrapeResult.markdown)
      throw new Error("Global search failed to return data.");

    const today = new Date().toDateString();
    const prompt = `
      CONTEXT: Today is ${today}.
      TASK: Extract a JSON list of ACTIVE frontend job postings from these search results.
      REQUIRED STRUCTURE: [{"title": "string", "company": "string", "url": "string"}]

      RULES:
      1. ONLY extract direct application URLs (must be lever.co, greenhouse.io, or ashbyhq.com).
      2. Identify the company name accurately from the snippet or URL.
      3. Ensure the role is "Frontend", "React", or "Software Engineer".
      4. Return ONLY raw JSON. No markdown blocks.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });
    const result = await model.generateContent([prompt, scrapeResult.markdown]);
    const aiText = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    const jobs = JSON.parse(aiText);
    console.log(`📡 Decoded ${jobs.length} global board leads.`);

    if (jobs.length === 0) {
      console.log("ℹ️ No new global leads found in this transmission.");
      return;
    }

    const newLeads = [];
    for (const job of jobs) {
      console.log(`🔍 Checking Command Center for: ${job.url}`);

      const { data: existing } = await supabase
        .from("jobs")
        .select("url")
        .eq("url", job.url)
        .maybeSingle();

      if (!existing) {
        console.log(`➕ Syncing New Global Lead: ${job.title}`);

        const { data: inserted, error: insertError } = await supabase
          .from("jobs")
          .insert([
            {
              ...job,
              location: "Remote (Global Feed)",
              description: `Official job board posting detected via Global Pivot for ${job.company}`,
              status: "new",
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("❌ DB Insert Error:", insertError.message);
        } else if (inserted) {
          newLeads.push(inserted);
        }
      }
    }

    // --- EMAIL NOTIFICATION BLOCK ---
    if (newLeads.length > 0) {
      console.log(
        `✅ ${newLeads.length} leads stored. Triggering Resend Dispatch...`,
      );

      const { data, error } = await resend.emails.send({
        from: "CipherHunt-Global <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🌐 Global-Feed: ${newLeads.length} Official Postings Found`,
        html: `
          <div style="background: #0f172a; color: #f1f5f9; padding: 40px; font-family: sans-serif; border-top: 4px solid #3b82f6;">
            <h1 style="color: #3b82f6; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">Global Intelligence Sync</h1>
            <p style="color: #94a3b8; font-size: 14px;">The following formal applications have been decrypted from the Global Board Feed.</p>
            <div style="margin: 30px 0; border-top: 1px solid #1e293b;"></div>
            ${newLeads
              .map(
                (j) => `
              <div style="margin-bottom: 25px; background: #1e293b; padding: 20px; border-radius: 8px;">
                <div style="font-size: 18px; font-weight: bold; color: #f8fafc;">${j.title}</div>
                <div style="color: #3b82f6; font-weight: 600; margin: 5px 0;">${j.company}</div>
                <a href="${j.url}" style="display: inline-block; margin-top: 10px; background: #3b82f6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold;">OPEN APPLICATION →</a>
              </div>
            `,
              )
              .join("")}
            <p style="font-size: 10px; color: #475569; margin-top: 40px;">Transmission handled by Cipher Hunt Global Agent.</p>
          </div>
        `,
      });

      if (error) {
        console.error("❌ RESEND ERROR:", error.message);
      } else {
        console.log("📨 GLOBAL EMAIL SENT! ID:", data.id);
      }
    } else {
      console.log("ℹ️ All signals were duplicates. No email dispatched.");
    }
  } catch (err) {
    console.error("❌ GLOBAL SCOUT FAILURE:", err.message);
  }
}

runGlobalScout();
