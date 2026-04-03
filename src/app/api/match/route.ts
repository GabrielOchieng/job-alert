import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { jobDescription } = await req.json();
    const supabase = getSupabase();

    // 1. Fetch Gabriel's actual resume from Supabase
    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text")
      .eq("id", "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")
      .single();

    if (!profile?.resume_text) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    // 2. Define AI configuration
    const schema = z.object({
      score: z
        .number()
        .describe("A whole number between 0 and 100. Do not use decimals."),
      matching_skills: z.array(z.string()),
      missing_skills: z.array(z.string()),
      brief_analysis: z.string(),
    });

    const systemPrompt = `You are a strict Applicant Tracking System (ATS) and Technical Recruiter. 
               Compare the resume to the job description provided.
               SCORING RULES: 
               - Provide a score from 0 to 100 as an INTEGER. 
               - 90-100: Excellent fit, almost all skills match.
               - 70-89: Good fit, has core skills but missing minor ones.
               - Below 70: Missing core technical requirements.
               - DO NOT return 0.9 or 0.8; return 90 or 80.`;

    const userPrompt = `RESUME: ${profile.resume_text}\n\nJOB DESCRIPTION: ${jobDescription}`;

    // 3. Execution with Manual Fallback
    let result;
    try {
      // Try Primary Model (3.1 Lite)
      result = await generateText({
        model: google("gemini-3.1-flash-lite-preview"),
        output: Output.object({ schema }),
        system: systemPrompt,
        prompt: userPrompt,
      });
    } catch (primaryError: any) {
      // If Primary fails with Rate Limit (429) or Server Error (5xx), try Backup
      if (
        primaryError.statusCode === 404 ||
        primaryError.statusCode === 429 ||
        primaryError.statusCode >= 500
      ) {
        console.warn(
          "Match primary model throttled, switching to Gemini 1.5 backup...",
        );
        result = await generateText({
          model: google("gemini-2.5-flash"),
          output: Output.object({ schema }),
          system: systemPrompt,
          prompt: userPrompt,
        });
      } else {
        throw primaryError;
      }
    }

    return NextResponse.json(result.output);
  } catch (error: any) {
    console.error("Match Error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: error.statusCode || 500 },
    );
  }
}
