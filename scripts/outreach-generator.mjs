import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MY_RESUME_SUMMARY = `
Frontend Engineer with 4+ years experience in React, Next.js, and TypeScript. 
Expert in building high-performance dashboards and AI-integrated web apps. 
Based in Nairobi, looking for remote-first roles.
`;

// --- NEW MODEL POOL ---
// We use Gemini 3.1 Flash-Lite for high-volume, low-latency stability
const MODEL_POOL = [
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash",
];

export async function generateColdOutreach(job) {
  const prompt = `
    CONTEXT:
    My Resume: ${MY_RESUME_SUMMARY}
    Target Job: ${job.title} at ${job.company}

    TASK:
    Write TWO short, punchy outreach messages:
    1. A LinkedIn Connection Request (max 300 chars).
    2. A Cold Email/DM (max 3 sentences).

    GUIDELINES:
    - Avoid generic fluff. Be direct. Mention React/Next.js.
    - JSON ONLY: {"linkedin": "...", "email": "..."}
  `;

  // --- LOOP THROUGH MODELS FOR FALLBACK ---
  for (const modelName of MODEL_POOL) {
    try {
      console.log(`🤖 [Outreach AI] Attempting generation with: ${modelName}`);

      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Clean and Parse JSON
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.warn(
        `⚠️ Model ${modelName} failed or busy. Error: ${error.message}`,
      );
      // Continue to next model in the pool
      continue;
    }
  }

  // --- CRITICAL FAILURE ---
  console.error("❌ All AI models in the pool failed to generate outreach.");
  return {
    linkedin: `Hi, I saw the ${job.title} role at ${job.company} and would love to connect!`,
    email: `Hi, I'm a React engineer interested in the ${job.title} opening at ${job.company}.`,
  };
}
