// import FirecrawlApp from "@mendable/firecrawl-js";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { createClient } from "@supabase/supabase-js";
// import { Resend } from "resend";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";

// // Initialize Environment
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dotenv.config({ path: path.resolve(__dirname, "../.env") });

// async function runTwitterScout() {
//   const apiKey = process.env.FIRECRAWL_API_KEY;
//   if (!apiKey) {
//     console.error("❌ Error: FIRECRAWL_API_KEY is missing.");
//     process.exit(1);
//   }

//   const firecrawl = new FirecrawlApp({ apiKey });
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   const supabase = createClient(
//     process.env.SUPABASE_URL,
//     process.env.SUPABASE_KEY,
//   );
//   const resend = new Resend(process.env.RESEND_API_KEY);

//   // We target Google Search because it bypasses Twitter's login wall
//   // Query: Finds tweets containing "hiring", "frontend", "remote" from the last 24 hours
//   const targetUrl =
//     "https://www.google.com/search?q=site:x.com+%22hiring%22+%22frontend%22+%22remote%22+after:2026-04-01&tbs=qdr:d";

//   console.log(
//     "🕵️‍♂️ [Cipher Hunt] Intercepting X (Twitter) signals via Google Pivot...",
//   );

//   try {
//     const scrapeResult = await firecrawl.scrape(targetUrl, {
//       formats: ["markdown"],
//       waitFor: 5000,
//     });

//     if (!scrapeResult.markdown) throw new Error("Intelligence feed empty.");

//     const prompt = `
//       You are an OSINT Intelligence Officer. Analyze this Google Search result of Tweets.
//       Extract a JSON list of ACTIVE hiring signals: [{"title": "string", "company": "string", "url": "string"}]

//       RULES:
//       1. Company name should be the Twitter handle (e.g., @StartupCEO).
//       2. Title should be a summary of the role mentioned.
//       3. URL must be the direct link to the tweet.
//       4. ONLY extract if they mention "Frontend", "React", "Next.js", or "Software Engineer".
//       5. Return ONLY the raw JSON array.

//       CONTENT:
//       ${scrapeResult.markdown}
//     `;

//     const model = genAI.getGenerativeModel({
//       model: "gemini-3.1-flash-lite-preview",
//     });
//     const result = await model.generateContent(prompt);
//     const jobs = JSON.parse(
//       result.response
//         .text()
//         .replace(/```json|```/g, "")
//         .trim(),
//     );

//     console.log(`📡 Decoded ${jobs.length} social signals.`);

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
//           .insert([job])
//           .select()
//           .single();
//         if (inserted) newLeads.push(inserted);
//       }
//     }

//     if (newLeads.length > 0) {
//       await resend.emails.send({
//         from: "CipherHunt-X <onboarding@resend.dev>",
//         to: process.env.MY_EMAIL,
//         subject: `🐦 X-Signal: ${newLeads.length} Stealth Leads Found`,
//         html: `
//           <div style="background: #020617; color: #f8fafc; padding: 30px; font-family: monospace; border-left: 4px solid #8b5cf6;">
//             <h2 style="color: #8b5cf6; text-transform: uppercase;">Social Intelligence Decoded</h2>
//             <p style="color: #94a3b8;">High-intent hiring signals intercepted from X.com</p>
//             <hr style="border: 0.5px solid #1e293b; margin: 20px 0;" />
//             ${newLeads
//               .map(
//                 (j) => `
//               <div style="margin-bottom: 20px;">
//                 <strong style="font-size: 16px;">${j.title}</strong><br/>
//                 <span style="color: #a78bfa;">Handle: ${j.company}</span><br/>
//                 <a href="${j.url}" style="color: #38bdf8; text-decoration: none;">View Original Tweet →</a>
//               </div>
//             `,
//               )
//               .join("")}
//           </div>
//         `,
//       });
//       console.log(`✅ Success! ${newLeads.length} stealth leads synced.`);
//     }
//   } catch (err) {
//     console.error("❌ X-Signal Interruption:", err.message);
//   }
// }

// runTwitterScout();

import FirecrawlApp from "@mendable/firecrawl-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 1. Initialize Environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runTwitterScout() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: FIRECRAWL_API_KEY is missing.");
    process.exit(1);
  }

  const firecrawl = new FirecrawlApp({ apiKey });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  // 2. DYNAMIC DATE CALCULATION (Strict 48h Window)
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  // Formats date for Google Search (e.g., "2026-04-04")
  const dateLimit = yesterday.toISOString().split("T")[0];
  const todayString = now.toDateString();

  // The 'qdr:d' restricts Google to results indexed in the last 24h
  // The 'after:' operator restricts to posts created after yesterday
  const targetUrl = `https://www.google.com/search?q=site:x.com+%22hiring%22+%22frontend%22+%22remote%22+after:${dateLimit}&tbs=qdr:d`;

  console.log(
    `🕵️‍♂️ [Cipher Hunt] Intercepting X signals. Current Date: ${todayString}`,
  );
  console.log(`📡 Filtering for signals after: ${dateLimit}`);

  try {
    const scrapeResult = await firecrawl.scrape(targetUrl, {
      formats: ["markdown"],
      waitFor: 5000,
    });

    if (!scrapeResult.markdown) throw new Error("Intelligence feed empty.");

    // 3. ENFORCED AI PROMPT
    const prompt = `
      CONTEXT: 
      - TODAY IS: ${todayString}
      - STRICT CUTOFF: Any post from before ${dateLimit} is EXPIRED.

      TASK:
      Analyze this Google Search result of Tweets.
      Extract a JSON list of ACTIVE hiring signals: [{"title": "string", "company": "string", "url": "string"}]

      STRICT INTELLIGENCE RULES:
      1. REJECT any tweet dated April 2nd or earlier.
      2. ONLY extract if the tweet mentions "Today", "Yesterday", or "1d ago".
      3. Company name should be the Twitter handle (e.g., @FounderName).
      4. Title should be a summary of the role (e.g., Senior React Engineer).
      5. URL must be the direct link to the tweet.
      6. Return ONLY a raw JSON array. If no matches found, return [].

      CONTENT:
      ${scrapeResult.markdown}
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });
    const result = await model.generateContent(prompt);
    const aiText = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    let jobs = [];
    try {
      jobs = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse AI response. Raw text:", aiText);
      return;
    }

    console.log(`📡 Decoded ${jobs.length} valid social signals.`);

    const newLeads = [];
    for (const job of jobs) {
      // Prevent duplicates by URL
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
              location: "Remote (X)",
              description: `Intercepted Signal from ${job.company}: ${job.title}`,
            },
          ])
          .select()
          .single();

        if (inserted) newLeads.push(inserted);
      }
    }

    // 4. THEMED NOTIFICATION
    if (newLeads.length > 0) {
      await resend.emails.send({
        from: "CipherHunt-X <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🐦 X-Signal: ${newLeads.length} Stealth Leads Decoded`,
        html: `
          <div style="background: #0c0a09; color: #fafaf9; padding: 40px; font-family: ui-monospace, monospace; border: 1px solid #a855f7; border-radius: 8px;">
            <h2 style="color: #a855f7; font-size: 18px; margin-bottom: 5px; text-transform: uppercase;">Social Intelligence Decoded</h2>
            <p style="color: #78716c; font-size: 12px; margin-bottom: 25px;">TIMESTAMP: ${new Date().toISOString()}</p>
            <div style="height: 1px; background: #292524; margin-bottom: 25px;"></div>
            ${newLeads
              .map(
                (j) => `
              <div style="margin-bottom: 25px;">
                <div style="font-size: 16px; font-weight: 800; color: #fafaf9;">${j.title}</div>
                <div style="color: #a855f7; font-size: 13px; margin: 4px 0;">Handle: ${j.company}</div>
                <a href="${j.url}" style="color: #38bdf8; text-decoration: none; font-size: 11px; font-weight: bold;">[INTERCEPT SIGNAL →]</a>
              </div>
            `,
              )
              .join("")}
            <div style="margin-top: 30px; font-size: 10px; color: #444;">Encrypted via Cipher Hunt Intelligence Engine</div>
          </div>
        `,
      });
      console.log(`✅ Success! ${newLeads.length} stealth leads synced.`);
    } else {
      console.log("ℹ️ All signals discarded. No fresh leads detected.");
    }
  } catch (err) {
    console.error("❌ X-Signal Interruption:", err.message);
  }
}

runTwitterScout();
