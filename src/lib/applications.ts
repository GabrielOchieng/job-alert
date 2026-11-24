import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

export type JobInput = {
  title: string;
  company: string;
  description?: string;
};

const tailoredResumeSchema = z.object({
  optimizedSummary: z
    .string()
    .describe("A professional summary focusing on AI integration and ROI."),
  suggestedBulletPoints: z
    .array(z.string())
    .describe("Impact-driven bullets with metrics like 60% efficiency gains."),
  keyKeywordsMissing: z.array(z.string()).describe("Missing ATS technical keywords."),
});

export type TailoredResumeData = z.infer<typeof tailoredResumeSchema>;

const applicationEmailSchema = z.object({
  subject: z.string().describe("A concise, professional application email subject line."),
  body: z
    .string()
    .describe(
      "A full, ready-to-send application email body (greeting, why he's a fit, close) — not a short cold-outreach opener.",
    ),
});

export type ApplicationEmailData = z.infer<typeof applicationEmailSchema>;

/**
 * Runs a structured-output Gemini call with the same two-tier fallback
 * every AI route in this app uses: gemini-3.1-flash-lite-preview first,
 * falling back to gemini-2.5-flash on a 404/429/5xx.
 */
async function generateWithFallback<T extends z.ZodTypeAny>({
  schema,
  system,
  prompt,
}: {
  schema: T;
  system: string;
  prompt: string;
}): Promise<z.infer<T>> {
  try {
    const result = await generateText({
      model: google("gemini-3.1-flash-lite-preview"),
      output: Output.object({ schema }),
      system,
      prompt,
    });
    return result.output as z.infer<T>;
  } catch (primaryError: any) {
    if (
      primaryError.statusCode === 404 ||
      primaryError.statusCode === 429 ||
      primaryError.statusCode >= 500
    ) {
      const result = await generateText({
        model: google("gemini-2.5-flash"),
        output: Output.object({ schema }),
        system,
        prompt,
      });
      return result.output as z.infer<T>;
    }
    throw primaryError;
  }
}

/** Extracted from the former inline logic in src/app/api/tailor-resume/route.ts. */
export async function generateTailoredResumeData(
  resumeText: string,
  job: JobInput,
): Promise<TailoredResumeData> {
  const systemPrompt = `You are an elite Tech Recruiter. Position Gabriel as a "Frontend Engineer & AI Solutions Integrator."
             Focus on his 60% reduction in manual processing wins at Jambojet.
             Highlight mastery of React, Next.js, and LLM orchestration.
             Target the specific needs of ${job.company}.`;

  const userPrompt = `ORIGINAL RESUME: ${resumeText}\n\nTARGET JOB DESCRIPTION: ${job.description || job.title}`;

  return generateWithFallback({
    schema: tailoredResumeSchema,
    system: systemPrompt,
    prompt: userPrompt,
  });
}

/** Drafts a full, addressed application email — not the short cold-outreach style of scripts/outreach-generator.mjs. */
export async function generateApplicationEmail(
  resumeText: string,
  job: JobInput,
): Promise<ApplicationEmailData> {
  const systemPrompt = `You are Gabriel, writing a real job application email to send directly to a hiring contact.
             Position yourself as a "Frontend Engineer & AI Solutions Integrator."
             Write in the FIRST PERSON, professional and confident, not a cold-outreach teaser — this is the actual application.
             Reference the specific role (${job.title}) and company (${job.company}).
             Mention that your tailored resume is attached.
             Keep it to 3-4 short paragraphs: opening (applying for X at Y), why you're a fit (concrete wins), closing (request next steps).`;

  const userPrompt = `RESUME: ${resumeText}\n\nJOB TITLE: ${job.title}\n\nCOMPANY: ${job.company}\n\nJOB DESCRIPTION: ${job.description || ""}`;

  return generateWithFallback({
    schema: applicationEmailSchema,
    system: systemPrompt,
    prompt: userPrompt,
  });
}
