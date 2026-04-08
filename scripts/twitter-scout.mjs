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
      model: "gemini-3.1-flash-lite-preview",
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
