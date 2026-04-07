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

// async function runPivotScout() {
//   console.log("🕵️‍♂️ [Cipher Hunt] Starting Deep-Post Pivot...");

//   // 1. DYNAMIC SEARCH: Specifically targets individual posts (/status/) and job boards
//   const query = `site:x.com/*/status/* "hiring" "frontend" "remote" ("lever.co" OR "greenhouse.io" OR "ashbyhq.com")`;
//   const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbs=qdr:d`;

//   try {
//     const scrapeResult = await firecrawl.scrape(targetUrl, {
//       formats: ["markdown"],
//       waitFor: 3000,
//     });

//     if (!scrapeResult.markdown || scrapeResult.markdown.length < 200) {
//       console.log("⚠️ Feed empty or blocked by Google. Try again in 1 hour.");
//       return;
//     }

//     const today = new Date().toDateString();

//     // 2. REFINED PROMPT: Forcing the AI to reject Profile Pages
//     const prompt = `
//       CONTEXT: Today is ${today}.
//       Analyze this Markdown from Google Search results of X/Twitter.

//       STRICT EXTRACTION RULES:
//       1. URL: Find the direct link to the TWEET (must contain /status/) or the JOB BOARD (lever.co, greenhouse.io, ashbyhq.com).
//       2. REJECT: Do not extract links that go to a user profile (e.g., x.com/user).
//       3. TITLE: Summarize the role (e.g., "Senior Frontend Engineer").
//       4. COMPANY: Use the @handle or Name mentioned as the source.
//       5. DATE: Only include signals from the last 48 hours.

//       JSON STRUCTURE: [{"title": "...", "company": "...", "url": "..."}]
//       Return ONLY a raw JSON array. If nothing found, return [].
//     `;

//     // Use stable model for consistent JSON output
//     const model = genAI.getGenerativeModel({
//       model: "gemini-3.1-flash-lite-preview",
//     });
//     const result = await model.generateContent([prompt, scrapeResult.markdown]);

//     const aiText = result.response
//       .text()
//       .replace(/```json|```/g, "")
//       .trim();
//     let jobs = [];
//     try {
//       jobs = JSON.parse(aiText);
//     } catch (e) {
//       console.error("❌ AI Formatting Error. Raw text:", aiText);
//       return;
//     }

//     console.log(`📡 Signals Decoded: ${jobs.length}`);

//     if (jobs.length === 0) {
//       console.log("ℹ️ No deep-post signals detected in this batch.");
//       return;
//     }

//     const newLeads = [];
//     for (const job of jobs) {
//       console.log(`🔍 Checking DB for Signal: ${job.url}`);

//       const { data: existing, error: checkError } = await supabase
//         .from("jobs")
//         .select("url")
//         .eq("url", job.url)
//         .maybeSingle();

//       if (checkError) console.error("❌ DB Check Error:", checkError.message);

//       if (!existing) {
//         console.log(`➕ Syncing New Signal: ${job.title}`);

//         // Ensure your Supabase table has 'location' and 'description' columns!
//         const { data: inserted, error: insertError } = await supabase
//           .from("jobs")
//           .insert([
//             {
//               ...job,
//               location: "Remote (X-Signal)",
//               description: `Intelligence intercepted via X Deep-Pivot for ${job.title}`,
//               status: "new",
//             },
//           ])
//           .select()
//           .single();

//         if (insertError) {
//           console.error("❌ DB Insert Failure:", insertError.message);
//           console.log(
//             "💡 Tip: Ensure columns 'location', 'description', and 'status' exist in Supabase.",
//           );
//         } else if (inserted) {
//           newLeads.push(inserted);
//         }
//       } else {
//         console.log("⏭️ Signal already indexed. Skipping.");
//       }
//     }

//     // 3. ENHANCED EMAIL LOGGING
//     if (newLeads.length > 0) {
//       console.log(`✅ ${newLeads.length} leads synced. Triggering Resend...`);

//       const { data, error } = await resend.emails.send({
//         from: "CipherHunt <onboarding@resend.dev>",
//         to: process.env.MY_EMAIL,
//         subject: `🎯 X-Signal: ${newLeads.length} Direct Intercepts Found`,
//         html: `
//           <div style="background: #020617; color: #f8fafc; padding: 30px; font-family: monospace; border-left: 4px solid #8b5cf6;">
//             <h2 style="color: #8b5cf6;">DEEP SIGNALS ACQUIRED</h2>
//             <p>Direct Tweet or Application links found:</p>
//             <hr style="border: 0.5px solid #1e293b; margin: 20px 0;" />
//             ${newLeads
//               .map(
//                 (j) => `
//               <div style="margin-bottom: 20px;">
//                 <strong style="font-size: 16px;">${j.title}</strong><br/>
//                 <span style="color: #a78bfa;">Source: ${j.company}</span><br/>
//                 <a href="${j.url}" style="color: #38bdf8; text-decoration: none;">[INTERCEPT SIGNAL →]</a>
//               </div>
//             `,
//               )
//               .join("")}
//           </div>
//         `,
//       });

//       if (error) {
//         console.error("❌ RESEND ERROR:", error.message);
//       } else {
//         console.log("📨 EMAIL SENT! ID:", data.id);
//       }
//     } else {
//       console.log("ℹ️ No unique leads found to notify about.");
//     }
//   } catch (err) {
//     console.error("❌ CRITICAL TRANSMISSION FAILURE:", err.message);
//   }
// }

// runPivotScout();

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

// --- HELPER: AI FALLBACK LOGIC ---
async function generateWithFallback(prompt, content) {
  const models = ["gemini-2.5-flash", "gemini-3.1-flash-lite-preview"]; // High availability models

  // Try the primary model first
  try {
    console.log("🤖 Attempting extraction with Primary Model...");
    const primaryModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const result = await primaryModel.generateContent([prompt, content]);
    return result.response.text();
  } catch (err) {
    console.warn(
      "⚠️ Primary Model failed (503/Busy). Attempting Stable Backup...",
    );

    // Fallback to Pro or an older stable version
    try {
      const backupModel = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
      });
      const result = await backupModel.generateContent([prompt, content]);
      return result.response.text();
    } catch (finalErr) {
      throw new Error("❌ All AI models are currently unavailable.");
    }
  }
}

async function runPivotScout() {
  console.log("🕵️‍♂️ [Cipher Hunt] Starting Deep-Post Pivot...");

  const query = `site:x.com/*/status/* "hiring" "frontend" "remote" ("lever.co" OR "greenhouse.io" OR "ashbyhq.com")`;
  const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbs=qdr:d`;

  try {
    const scrapeResult = await firecrawl.scrape(targetUrl, {
      formats: ["markdown"],
      waitFor: 3000,
    });

    if (!scrapeResult.markdown || scrapeResult.markdown.length < 200) {
      console.log("⚠️ Feed empty or blocked by Google. Try again in 1 hour.");
      return;
    }

    const today = new Date().toDateString();
    const prompt = `
      CONTEXT: Today is ${today}.
      Analyze this Markdown from Google Search results of X/Twitter.
      
      STRICT EXTRACTION RULES:
      1. URL: Find the direct link to the TWEET (must contain /status/) or the JOB BOARD (lever.co, greenhouse.io, ashbyhq.com). 
      2. REJECT: Do not extract links that go to a user profile (e.g., x.com/user).
      3. TITLE: Summarize the role (e.g., "Senior Frontend Engineer").
      4. COMPANY: Use the @handle or Name mentioned as the source.
      
      JSON STRUCTURE: [{"title": "...", "company": "...", "url": "..."}]
      Return ONLY a raw JSON array. If nothing found, return [].
    `;

    // CALLING THE FALLBACK HELPER
    const aiRawText = await generateWithFallback(prompt, scrapeResult.markdown);

    const aiText = aiRawText.replace(/```json|```/g, "").trim();
    let jobs = [];
    try {
      jobs = JSON.parse(aiText);
    } catch (e) {
      console.error("❌ AI Formatting Error. Raw text:", aiText);
      return;
    }

    console.log(`📡 Signals Decoded: ${jobs.length}`);
    if (jobs.length === 0) return;

    const newLeads = [];
    for (const job of jobs) {
      const { data: existing } = await supabase
        .from("jobs")
        .select("url")
        .eq("url", job.url)
        .maybeSingle();

      if (!existing) {
        const { data: inserted, error: insertError } = await supabase
          .from("jobs")
          .insert([
            {
              ...job,
              location: "Remote (X-Signal)",
              description: `Intelligence intercepted via X Deep-Pivot for ${job.title}`,
              status: "new",
            },
          ])
          .select()
          .single();

        if (inserted) newLeads.push(inserted);
      }
    }

    if (newLeads.length > 0) {
      const { error } = await resend.emails.send({
        from: "CipherHunt <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🎯 X-Signal: ${newLeads.length} Direct Intercepts Found`,
        html: `... (Your Existing HTML) ...`, // Keep your existing HTML here
      });
      if (!error) console.log("📨 EMAIL SENT!");
    }
  } catch (err) {
    console.error("❌ CRITICAL TRANSMISSION FAILURE:", err.message);
  }
}

runPivotScout();
