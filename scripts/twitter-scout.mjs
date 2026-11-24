import FirecrawlApp from "@mendable/firecrawl-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { dedupeAndInsertJobs } from "./lib/db.mjs";
import { sendNewLeadsEmail } from "./lib/notify.mjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function renderHtml(jobs) {
  return `<h2>New Leads Found</h2>${jobs.map((j) => `<p>${j.title} @ ${j.company}</p>`).join("")}`;
}

async function runTwitterScout() {
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    // FIX: Adding the required columns so the insert doesn't fail
    const candidateJobs = jobs.map((job) => ({
      ...job,
      location: "Remote (X-Signal)",
      description: `Intercepted stealth lead for ${job.title}`,
      status: "new",
    }));

    const newLeads = await dedupeAndInsertJobs(candidateJobs);
    for (const lead of newLeads) {
      console.log(`➕ NEW SIGNAL DETECTED: ${lead.title}`);
    }

    if (newLeads.length > 0) {
      console.log(`🚀 Sending email for ${newLeads.length} new leads!`);
      const mailResult = await sendNewLeadsEmail({
        from: "CipherHunt-X <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🐦 X-Signal: ${newLeads.length} New Leads`,
        jobs: newLeads,
        renderHtml,
      });

      if (!mailResult.sent) console.error("❌ MAIL ERROR:", mailResult.reason);
      else console.log("📨 Email sent successfully!");
    } else {
      console.log("ℹ️ No brand new leads found this time.");
    }
  } catch (err) {
    console.error("❌ CRITICAL ERROR:", err.message);
  }
}

runTwitterScout();
