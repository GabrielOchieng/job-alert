import FirecrawlApp from "@mendable/firecrawl-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Initialize Environment
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

  // We target Google Search because it bypasses Twitter's login wall
  // Query: Finds tweets containing "hiring", "frontend", "remote" from the last 24 hours
  const targetUrl =
    "https://www.google.com/search?q=site:x.com+%22hiring%22+%22frontend%22+%22remote%22+after:2026-04-01&tbs=qdr:d";

  console.log(
    "🕵️‍♂️ [Cipher Hunt] Intercepting X (Twitter) signals via Google Pivot...",
  );

  try {
    const scrapeResult = await firecrawl.scrape(targetUrl, {
      formats: ["markdown"],
      waitFor: 5000,
    });

    if (!scrapeResult.markdown) throw new Error("Intelligence feed empty.");

    const prompt = `
      You are an OSINT Intelligence Officer. Analyze this Google Search result of Tweets.
      Extract a JSON list of ACTIVE hiring signals: [{"title": "string", "company": "string", "url": "string"}]

      RULES:
      1. Company name should be the Twitter handle (e.g., @StartupCEO).
      2. Title should be a summary of the role mentioned.
      3. URL must be the direct link to the tweet.
      4. ONLY extract if they mention "Frontend", "React", "Next.js", or "Software Engineer".
      5. Return ONLY the raw JSON array.

      CONTENT:
      ${scrapeResult.markdown}
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    const result = await model.generateContent(prompt);
    const jobs = JSON.parse(
      result.response
        .text()
        .replace(/```json|```/g, "")
        .trim(),
    );

    console.log(`📡 Decoded ${jobs.length} social signals.`);

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
          .insert([job])
          .select()
          .single();
        if (inserted) newLeads.push(inserted);
      }
    }

    if (newLeads.length > 0) {
      await resend.emails.send({
        from: "CipherHunt-X <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🐦 X-Signal: ${newLeads.length} Stealth Leads Found`,
        html: `
          <div style="background: #020617; color: #f8fafc; padding: 30px; font-family: monospace; border-left: 4px solid #8b5cf6;">
            <h2 style="color: #8b5cf6; text-transform: uppercase;">Social Intelligence Decoded</h2>
            <p style="color: #94a3b8;">High-intent hiring signals intercepted from X.com</p>
            <hr style="border: 0.5px solid #1e293b; margin: 20px 0;" />
            ${newLeads
              .map(
                (j) => `
              <div style="margin-bottom: 20px;">
                <strong style="font-size: 16px;">${j.title}</strong><br/>
                <span style="color: #a78bfa;">Handle: ${j.company}</span><br/>
                <a href="${j.url}" style="color: #38bdf8; text-decoration: none;">View Original Tweet →</a>
              </div>
            `,
              )
              .join("")}
          </div>
        `,
      });
      console.log(`✅ Success! ${newLeads.length} stealth leads synced.`);
    }
  } catch (err) {
    console.error("❌ X-Signal Interruption:", err.message);
  }
}

runTwitterScout();
