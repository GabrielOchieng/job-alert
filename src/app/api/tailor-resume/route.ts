// import { google } from "@ai-sdk/google";
// import { generateText, Output } from "ai";
// import { z } from "zod";
// import { getSupabase } from "@/lib/supabase";
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const { jobTitle, company, jobDescription } = await req.json();
//     const supabase = getSupabase();

//     // 1. Fetch Gabriel's actual resume from Supabase
//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("resume_text")
//       .eq("id", "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")
//       .single();

//     if (!profile?.resume_text) {
//       return NextResponse.json({ error: "Resume missing" }, { status: 400 });
//     }

//     // 2. Use the modern generateText + Output.object pattern
//     const { output } = await generateText({
//       // model: google("gemini-2.0-flash"),
//       model: google("gemini-3.1-flash-lite-preview"),
//       output: Output.object({
//         schema: z.object({
//           optimizedSummary: z
//             .string()
//             .describe(
//               "A 3-4 sentence professional summary tailored to this specific role.",
//             ),
//           suggestedBulletPoints: z
//             .array(z.string())
//             .describe(
//               "3-5 high-impact bullet points to add or swap into the experience section.",
//             ),
//           keyKeywordsMissing: z
//             .array(z.string())
//             .describe(
//               "Specific technical keywords from the job description that were missing from the original resume.",
//             ),
//         }),
//       }),
//       system: `You are an elite Tech Recruiter specializing in AI and Automation.
//          Your goal is to optimize Gabriel's resume for the ${jobTitle} role at ${company}.

//          IDENTITY:
//          Position Gabriel as a "Frontend Engineer & AI Solutions Integrator."
//          He is not just a UI developer; he is a specialist in building high-performance
//          interfaces that leverage AI and automation to solve complex business problems.

//          IMPACT-DRIVEN BULLET POINTS:
//          1. Use the formula: [Action Verb] + [Technical Task] + [Quantifiable Business Result].
//          2. Prioritize his Jambojet achievements: Architecting systems that achieved a 60% reduction in manual processing.
//          3. Integrate his "AI Specialist" persona: If the job involves AI, frame his React/Next.js experience as the "Interface for AI Orchestration."
//          4. Use STAR methodology: Situation, Task, Action, Result.

//          SUMMARY RULES:
//          1. Do NOT mention Jambojet in the first sentence.
//          2. Start with his identity: "Product-focused Frontend Engineer & AI Integrator."
//          3. Highlight his mastery of Next.js, TypeScript, and LLM integration (if applicable).
//          4. End with a specific value proposition for ${company}.`,
//       prompt: `ORIGINAL RESUME: ${profile.resume_text}\n\nTARGET JOB DESCRIPTION: ${jobDescription}`,
//     });

//     // Return the typed output object
//     return NextResponse.json(output);
//   } catch (error: any) {
//     console.error("Tailor Error:", error);
//     // If it's a rate limit error, tell the user to wait
//     if (error.statusCode === 429) {
//       return NextResponse.json(
//         { error: "AI is busy. Please wait 30 seconds and try again." },
//         { status: 429 },
//       );
//     }
//     return NextResponse.json({ error: "Optimization failed" }, { status: 500 });
//   }
// }

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { jobTitle, company, jobDescription } = await req.json();
    const supabase = getSupabase();

    // 1. Fetch Gabriel's actual resume from Supabase [cite: 26, 27]
    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text")
      .eq("id", "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")
      .single();

    if (!profile?.resume_text) {
      return NextResponse.json({ error: "Resume missing" }, { status: 400 });
    }

    // 2. Define our AI configuration [cite: 31, 32]
    const schema = z.object({
      optimizedSummary: z
        .string()
        .describe("A professional summary focusing on AI integration and ROI."),
      suggestedBulletPoints: z
        .array(z.string())
        .describe(
          "Impact-driven bullets with metrics like 60% efficiency gains.",
        ),
      keyKeywordsMissing: z
        .array(z.string())
        .describe("Missing ATS technical keywords."),
    });

    const systemPrompt = `You are an elite Tech Recruiter. Position Gabriel as a "Frontend Engineer & AI Solutions Integrator." 
               Focus on his 60% reduction in manual processing wins at Jambojet. 
               Highlight mastery of React, Next.js, and LLM orchestration. 
               Target the specific needs of ${company}.`;

    const userPrompt = `ORIGINAL RESUME: ${profile.resume_text}\n\nTARGET JOB DESCRIPTION: ${jobDescription}`;

    // 3. Robust Execution with manual fallback
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
          "Primary model throttled, switching to Gemini 1.5 Flash backup...",
        );
        result = await generateText({
          model: google("gemini-2.5-flash"),
          output: Output.object({ schema }),
          system: systemPrompt,
          prompt: userPrompt,
        });
      } else {
        throw primaryError; // Re-throw if it's a different type of error
      }
    }

    return NextResponse.json(result.output);
  } catch (error: any) {
    console.error("Tailor Error:", error);
    return NextResponse.json(
      { error: error.message || "Optimization failed" },
      { status: error.statusCode || 500 },
    );
  }
}
