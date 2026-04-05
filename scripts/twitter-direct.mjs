// import FirecrawlApp from "@mendable/firecrawl-js";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { createClient } from "@supabase/supabase-js";
// import { Resend } from "resend";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";

// // 1. Initialize Environment
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dotenv.config({ path: path.resolve(__dirname, "../.env") });

// async function runDirectHunt() {
//   // 2. Client Initialization
//   const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   const supabase = createClient(
//     process.env.SUPABASE_URL,
//     process.env.SUPABASE_KEY,
//   );
//   const resend = new Resend(process.env.RESEND_API_KEY);

//   const targetUrl = "https://x.com/search?q=frontend%20remote%20hiring&f=live";
//   console.log("🕵️‍♂️ [Cipher Hunt] Initiating Direct X-Session Intercept...");

//   try {
//     // 3. AUTHENTICATED SCRAPE WITH INTERACTION
//     const scrapeResult = await firecrawl.scrape(targetUrl, {
//       formats: ["markdown"],
//       headers: {
//         Cookie: `auth_token=${process.env.TWITTER_AUTH_TOKEN};`,
//       },
//       actions: [
//         { type: "scroll", direction: "down", amount: 2500 },
//         { type: "wait", milliseconds: 3000 },
//         { type: "scroll", direction: "down", amount: 2500 },
//         { type: "wait", milliseconds: 2000 },
//       ],
//     });

//     if (!scrapeResult.markdown) throw new Error("No data received from X.");

//     // 4. VITALITY CHECK: Did the session expire?
//     if (
//       scrapeResult.markdown.includes("Log in to X") ||
//       scrapeResult.markdown.includes("Sign up")
//     ) {
//       console.error("❌ SESSION EXPIRED: Auth Token is no longer valid.");

//       await resend.emails.send({
//         from: "CipherHunt-System <onboarding@resend.dev>",
//         to: process.env.MY_EMAIL,
//         subject: "⚠️ ACTION REQUIRED: Twitter Session Expired",
//         html: `
//           <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 8px;">
//             <h2 style="color: #ef4444;">Intelligence Feed Interrupted</h2>
//             <p>Your Twitter <strong>auth_token</strong> has expired or been invalidated.</p>
//             <p>Please follow the README to extract a new token and update your <code>.env</code> file to resume scouting.</p>
//           </div>
//         `,
//       });
//       return;
//     }

//     // 5. AI INTELLIGENCE (Strict Filtering & Link Extraction)
//     const now = new Date();
//     const prompt = `
//       CONTEXT: Today is ${now.toDateString()}.
//       TASK: Analyze these Tweets from a live session. Extract a JSON list of jobs.

//       STRUCTURE: [{"title": "string", "company": "string", "url": "string", "description": "string"}]

//       STRICT RULES:
//       1. Extract ONLY jobs posted "Today", "Yesterday", or "1d". REJECT anything older.
//       2. If the tweet contains an external link (Greenhouse, Lever, Ashby, or company site), use THAT as the URL.
//       3. Use the Twitter @handle as the company name.
//       4. If no external link exists, use the direct URL of the Tweet.
//       5. Return ONLY a raw JSON array. If empty, return [].

//       CONTENT:
//       ${scrapeResult.markdown}
//     `;

//     const model = genAI.getGenerativeModel({
//       model: "gemini-3.1-flash-lite-preview",
//     });
//     const result = await model.generateContent(prompt);
//     const aiText = result.response
//       .text()
//       .replace(/```json|```/g, "")
//       .trim();

//     let jobs = [];
//     try {
//       jobs = JSON.parse(aiText);
//     } catch (e) {
//       console.error("Parsing Error. Raw AI Output:", aiText);
//       return;
//     }

//     console.log(`📡 Intercepted ${jobs.length} potential stealth leads.`);

//     // 6. DB SYNC & NOTIFICATION
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
//               location: "Remote (Direct X)",
//               description:
//                 job.description || `Intercepted Signal from ${job.company}`,
//             },
//           ])
//           .select()
//           .single();

//         if (inserted) newLeads.push(inserted);
//       }
//     }

//     if (newLeads.length > 0) {
//       await resend.emails.send({
//         from: "CipherHunt-X <onboarding@resend.dev>",
//         to: process.env.MY_EMAIL,
//         subject: `🎯 X-Direct: ${newLeads.length} Stealth Leads Decoded`,
//         html: `
//           <div style="background: #0c0a09; color: #fafaf9; padding: 40px; font-family: ui-monospace, monospace;">
//             <h1 style="color: #a855f7; border-bottom: 1px solid #292524; padding-bottom: 10px;">DIRECT SIGNALS ACQUIRED</h1>
//             ${newLeads
//               .map(
//                 (j) => `
//               <div style="margin-top: 20px; border-left: 2px solid #a855f7; padding-left: 15px;">
//                 <div style="font-size: 16px; font-weight: bold;">${j.title}</div>
//                 <div style="color: #78716c; font-size: 13px;">${j.company}</div>
//                 <a href="${j.url}" style="color: #38bdf8; text-decoration: none; font-size: 11px;">[ACCESS SIGNAL →]</a>
//               </div>
//             `,
//               )
//               .join("")}
//           </div>
//         `,
//       });
//       console.log(`✅ Success! ${newLeads.length} leads synced.`);
//     } else {
//       console.log("ℹ️ No new signals decoded in this transmission.");
//     }
//   } catch (err) {
//     console.error("❌ Critical Failure:", err.message);
//   }
// }

// runDirectHunt();

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

async function runPivotScout() {
  console.log("🕵️‍♂️ [Cipher Hunt] Intercepting X signals via Search Pivot...");

  // IMPROVEMENT 1: Rotate Queries to find different leads each run
  const QUERIES = [
    `site:x.com "hiring" "frontend" "remote" ("lever.co" OR "greenhouse.io")`,
    `site:x.com "hiring" "react" "remote" ("ashbyhq.com" OR "workable.com")`,
    `site:x.com "looking for" "nextjs" "remote" "frontend"`,
    `site:x.com "hiring" "frontend" "worldwide" ("app.ashbyhq.com" OR "jobs.lever.co")`,
  ];
  const randomQuery = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(randomQuery)}&tbs=qdr:d`;

  console.log(`📡 Using Query: ${randomQuery}`);

  try {
    const scrapeResult = await firecrawl.scrape(targetUrl, {
      formats: ["markdown"],
      waitFor: 3000,
    });

    if (!scrapeResult.markdown || scrapeResult.markdown.length < 100) {
      console.log(
        "⚠️ Scrape returned nearly empty content. Google might be rate-limiting.",
      );
      return;
    }

    const today = new Date().toDateString();
    const prompt = `
      CONTEXT: Today is ${today}.
      Analyze this Markdown from a Google Search of Tweets. 
      Extract a JSON list of jobs: [{"title": "string", "company": "string", "url": "string"}]

      STRICT RULES:
      1. ONLY extract if the snippet looks like a job post from the last 48 hours.
      2. Priority 1: Extract the direct link to the job board (Lever, Greenhouse, etc).
      3. Priority 2: If no direct link, use the Tweet URL.
      4. Use the @handle or person's name as the 'company'.
      5. Return ONLY a raw JSON array. If nothing found, return [].
    `;

    // IMPROVEMENT 2: Use stable model name
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });
    const result = await model.generateContent([prompt, scrapeResult.markdown]);
    const aiText = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    const jobs = JSON.parse(aiText);
    console.log(`📡 Decoded ${jobs.length} signals from the raw feed.`);

    if (jobs.length === 0) {
      console.log("ℹ️ No fresh signals detected in this batch.");
      return;
    }

    const newLeads = [];
    for (const job of jobs) {
      const { data: existing } = await supabase
        .from("jobs")
        .select("url")
        .eq("url", job.url)
        .maybeSingle();

      if (!existing) {
        const { data: inserted } = await supabase
          .from("jobs")
          .insert([
            {
              ...job,
              location: "Remote (X-Signal)",
              description: `Stealth Lead intercepted via X-Pivot for ${job.title}`,
            },
          ])
          .select()
          .single();
        if (inserted) newLeads.push(inserted);
      }
    }

    // IMPROVEMENT 3: Advanced Resend Logging
    if (newLeads.length > 0) {
      console.log(
        `✅ Success! ${newLeads.length} leads synced. Attempting email...`,
      );

      const { data, error } = await resend.emails.send({
        from: "CipherHunt <onboarding@resend.dev>",
        to: process.env.MY_EMAIL, // This MUST be your Resend-verified email
        subject: `🎯 X-Signal: ${newLeads.length} Stealth Leads Decoded`,
        html: `
          <div style="background: #0c0a09; color: #fafaf9; padding: 30px; font-family: monospace;">
            <h2 style="color: #a855f7;">SIGNALS DECODED</h2>
            ${newLeads
              .map(
                (j) => `
              <div style="margin-bottom: 20px;">
                <strong>${j.title}</strong><br/>
                <span style="color: #a855f7;">@ ${j.company}</span><br/>
                <a href="${j.url}" style="color: #38bdf8;">[ACCESS SIGNAL]</a>
              </div>
            `,
              )
              .join("")}
          </div>
        `,
      });

      if (error) {
        console.error("❌ RESEND ERROR:", error.message);
        console.error("DEBUG INFO:", {
          recipient: process.env.MY_EMAIL,
          using_onboarding_address: "onboarding@resend.dev",
        });
      } else {
        console.log("📨 Email sent successfully! ID:", data.id);
      }
    }
  } catch (err) {
    console.error("❌ Pivot Failure:", err.message);
  }
}

runPivotScout();
