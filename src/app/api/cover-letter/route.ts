// import { google } from "@ai-sdk/google";
// import { generateText } from "ai";
// import { getSupabase } from "@/lib/supabase";
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const { jobTitle, company, jobDescription } = await req.json();
//     const supabase = getSupabase();

//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("resume_text")
//       .eq("id", "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")
//       .single();

//     if (!profile?.resume_text) {
//       return NextResponse.json({ error: "Resume missing" }, { status: 400 });
//     }

//     const { text } = await generateText({
//       // model: google("gemini-2.5-flash"),
//       model: google("gemini-3.1-flash-lite-preview"),
//       system: `You are the job applicant. Your name is Gabriel.
//                Write a professional, persuasive 3-paragraph cover letter.

//                STRICT WRITING RULES:
//                - Write in the FIRST PERSON ("I am", "I have", "My experience").
//                - NEVER refer to yourself in the third person (Avoid "As Gabriel...", use "I am...").
//                - Do NOT act as a recruiter, agent, or third party. You ARE the candidate.
//                - DYNAMIC CONTENT: Paragraph 2 must focus on the specific technical skills required in the JOB DESCRIPTION below and match them to your RESUME.
//                - Tone: Professional, hungry, and clear.

//                STRUCTURE:
//                Paragraph 1: State clearly that you are applying for ${jobTitle} at ${company}.
//                Paragraph 2: Deep dive into your relevant technical wins that solve the specific needs of this job.
//                Paragraph 3: Professional closing and request for an interview.`,
//       prompt: `RESUME: ${profile.resume_text}\n\nJOB TITLE: ${jobTitle}\n\nCOMPANY: ${company}\n\nJOB DESCRIPTION: ${jobDescription}`,
//     });

//     return NextResponse.json({ letter: text });
//   } catch (error: any) {
//     console.error("Cover Letter Error:", error);
//     return NextResponse.json({ error: "Generation failed" }, { status: 500 });
//   }
// }

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { jobTitle, company, jobDescription } = await req.json();
    const supabase = getSupabase();

    // 1. Fetch Gabriel's actual resume from Supabase
    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text")
      .eq("id", "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")
      .single();

    if (!profile?.resume_text) {
      return NextResponse.json({ error: "Resume missing" }, { status: 400 });
    }

    // 2. Define AI Prompts
    const systemPrompt = `You are the job applicant, Gabriel. Write a professional, persuasive 3-paragraph cover letter.
               
               IDENTITY & TONE:
               - Position yourself as a "Frontend Engineer & AI Solutions Integrator." 
               - Write in the FIRST PERSON ("I am", "My experience").
               - Tone: Professional, hungry, and results-oriented.
               
               STRICT WRITING RULES:
               - NEVER refer to yourself in the third person.
               - Paragraph 2 MUST focus on specific technical wins from your resume (like the 60% reduction in manual processing)  
                 and match them to the ${jobDescription}.
               
               STRUCTURE:
               Paragraph 1: Clear application for ${jobTitle} at ${company}.
               Paragraph 2: Deep dive into technical wins using React, Next.js, and AI automation to solve their specific needs. [cite: 14, 26]
               Paragraph 3: Professional closing and request for an interview.`;

    const userPrompt = `RESUME: ${profile.resume_text}\n\nJOB TITLE: ${jobTitle}\n\nCOMPANY: ${company}\n\nJOB DESCRIPTION: ${jobDescription}`;

    // 3. Robust Execution with Manual Fallback
    let result;
    try {
      // Try Primary Model (3.1 Lite)
      result = await generateText({
        model: google("gemini-1.5-flash-latest"),
        // model: google("gemini-3.1-flash-lite-preview"),
        system: systemPrompt,
        prompt: userPrompt,
      });
    } catch (primaryError: any) {
      // Fallback to 1.5 Flash if Lite is throttled (429) or down (5xx)
      if (
        primaryError.statusCode === 404 ||
        primaryError.statusCode === 429 ||
        primaryError.statusCode >= 500
      ) {
        console.warn(
          "Cover letter primary model throttled, switching to Gemini 1.5 backup...",
        );
        result = await generateText({
          // model: google("gemini-1.5-flash-latest"),
          model: google("gemini-2.5-flash"),
          system: systemPrompt,
          prompt: userPrompt,
        });
      } else {
        throw primaryError;
      }
    }

    return NextResponse.json({ letter: result.text });
  } catch (error: any) {
    console.error("Cover Letter Error:", error);
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: error.statusCode || 500 },
    );
  }
}
