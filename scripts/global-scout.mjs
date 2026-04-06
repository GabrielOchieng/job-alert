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
  console.log(
    "🌐 [Cipher Hunt] Initiating Global Board Intercept (Non-API)...",
  );

  // This query targets the "Big Three" ATS platforms where 80% of tech startups post
  const query = `(site:lever.co OR site:greenhouse.io OR site:ashbyhq.com) "frontend" "remote" "apply" after:2026-04-01`;
  const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  try {
    const scrapeResult = await firecrawl.scrape(targetUrl, {
      formats: ["markdown"],
      waitFor: 3000,
    });

    if (!scrapeResult.markdown) throw new Error("Global feed empty.");

    const today = new Date().toDateString();
    const prompt = `
      CONTEXT: Today is ${today}.
      Analyze this Markdown of Google Search results. 
      Extract a JSON list of ACTIVE jobs: [{"title": "string", "company": "string", "url": "string"}]

      RULES:
      1. ONLY extract if the link is a direct application page (lever.co/..., greenhouse.io/..., etc).
      2. REJECT general 'careers' pages; we want specific JOB postings.
      3. Identify the company name from the URL or snippet text.
      4. Return ONLY a raw JSON array.
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
    console.log(`📡 Decoded ${jobs.length} global signals.`);

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
              location: "Remote (Global Feed)",
              description: `High-signal lead detected via Global Pivot for ${job.title}`,
              status: "new",
            },
          ])
          .select()
          .single();

        if (inserted) newLeads.push(inserted);
      }
    }

    if (newLeads.length > 0) {
      console.log(`✅ Success! ${newLeads.length} global leads synced.`);
      // Optional: Send a different-themed email for "Global" vs "X" leads
    }
  } catch (err) {
    console.error("❌ Global Pivot Failure:", err.message);
  }
}

runGlobalScout();
