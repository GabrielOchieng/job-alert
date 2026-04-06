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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runTwitterScout() {
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Broaden the date slightly to ensure we find something new
  const targetUrl =
    "https://www.google.com/search?q=site:x.com+%22hiring%22+%22frontend%22+%22remote%22&tbs=qdr:d";

  console.log("🕵️‍♂️ [Cipher Hunt] Intercepting X Signals...");

  try {
    const scrapeResult = await firecrawl.scrape(targetUrl, {
      formats: ["markdown"],
      waitFor: 5000,
    });

    if (!scrapeResult.markdown) throw new Error("Intelligence feed empty.");

    const prompt = `Extract JSON: [{"title": "string", "company": "string", "url": "string"}] from this content. Only Frontend/React roles. Return raw JSON array only.`;

    // Use stable model name
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    const result = await model.generateContent([prompt, scrapeResult.markdown]);
    const jobs = JSON.parse(
      result.response
        .text()
        .replace(/```json|```/g, "")
        .trim(),
    );

    console.log(`📡 AI found ${jobs.length} signals in the raw feed.`);

    const newLeads = [];
    for (const job of jobs) {
      // DEBUG LOG: See what we are checking
      console.log(`🔍 Checking DB for: ${job.url}`);

      const { data: existing } = await supabase
        .from("jobs")
        .select("url")
        .eq("url", job.url)
        .maybeSingle();

      if (!existing) {
        console.log(`➕ NEW SIGNAL DETECTED: ${job.title}`);

        // FIX: Adding the required columns so the insert doesn't fail
        const { data: inserted, error: insertError } = await supabase
          .from("jobs")
          .insert([
            {
              ...job,
              location: "Remote (X-Signal)",
              description: `Intercepted stealth lead for ${job.title}`,
              status: "new",
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("❌ INSERT FAILED:", insertError.message);
        } else if (inserted) {
          newLeads.push(inserted);
        }
      } else {
        console.log("⏭️ Already indexed. Skipping.");
      }
    }

    if (newLeads.length > 0) {
      console.log(`🚀 Sending email for ${newLeads.length} new leads!`);
      const { error: mailError } = await resend.emails.send({
        from: "CipherHunt-X <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🐦 X-Signal: ${newLeads.length} New Leads`,
        html: `<h2>New Leads Found</h2>${newLeads.map((j) => `<p>${j.title} @ ${j.company}</p>`).join("")}`,
      });

      if (mailError) console.error("❌ MAIL ERROR:", mailError.message);
      else console.log("📨 Email sent successfully!");
    } else {
      console.log("ℹ️ No brand new leads found this time.");
    }
  } catch (err) {
    console.error("❌ CRITICAL ERROR:", err.message);
  }
}

runTwitterScout();
