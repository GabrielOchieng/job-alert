// import { google } from "@ai-sdk/google";
// import { generateText, Output } from "ai";
// import { z } from "zod";
// import { getSupabase } from "@/lib/supabase";
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const { jobDescription } = await req.json();
//     const supabase = getSupabase();

//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("resume_text")
//       .eq("id", "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")
//       .single();

//     if (profileError || !profile?.resume_text) {
//       return NextResponse.json({ error: "Profile not found" }, { status: 400 });
//     }

//     // 2. The stable V6 syntax: generateText + Output.object
//     const { output } = await generateText({
//       //   model: google("gemini-3.1-flash-lite-preview"),
//       model: google("gemini-2.5-flash"),
//       // 3. Use Output.object (Capital O)
//       output: Output.object({
//         schema: z.object({
//           score: z.number(),
//           matching_skills: z.array(z.string()),
//           missing_skills: z.array(z.string()),
//           brief_analysis: z.string(),
//         }),
//       }),
//       system:
//         "You are a technical recruiter. Compare the resume to the job description.",
//       prompt: `Resume: ${profile.resume_text}\n\nJob: ${jobDescription}`,
//     });

//     // 4. In this new version, the result is destructured directly as 'output'
//     return NextResponse.json(output);
//   } catch (error: any) {
//     console.error("AI Match Error Details:", error);
//     return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
//   }
// }

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { jobDescription } = await req.json();
    const supabase = getSupabase();

    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text")
      .eq("id", "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")
      .single();

    if (!profile?.resume_text) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const { output } = await generateText({
      // model: google("gemini-1.5-flash-latest"),
      model: google("gemini-2.5-flash"),
      output: Output.object({
        schema: z.object({
          score: z
            .number()
            .describe("A whole number between 0 and 100. Do not use decimals."),
          matching_skills: z.array(z.string()),
          missing_skills: z.array(z.string()),
          brief_analysis: z.string(),
        }),
      }),
      system: `You are a strict Applicant Tracking System (ATS) and Technical Recruiter. 
               Compare the resume to the job description provided.
               SCORING RULES: 
               - Provide a score from 0 to 100 as an INTEGER. 
               - 90-100: Excellent fit, almost all skills match.
               - 70-89: Good fit, has core skills but missing minor ones.
               - Below 70: Missing core technical requirements.
               - DO NOT return 0.9 or 0.8; return 90 or 80.`,
      prompt: `RESUME: ${profile.resume_text}\n\nJOB DESCRIPTION: ${jobDescription}`,
    });

    return NextResponse.json(output);
  } catch (error: any) {
    console.error("Match Error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
