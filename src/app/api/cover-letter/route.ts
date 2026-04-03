// import { google } from "@ai-sdk/google";
// import { generateText } from "ai";
// import { getSupabase } from "@/lib/supabase";
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     // 1. Ensure we destructure exactly what the frontend is sending
//     const { jobTitle, company, jobDescription } = await req.json();
//     const supabase = getSupabase();

//     // 2. Fetch the profile (Double check the hardcoded ID matches your match route)
//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("resume_text")
//       .eq("id", "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")
//       .single();

//     if (profileError || !profile?.resume_text) {
//       console.error("Profile Fetch Error:", profileError);
//       return NextResponse.json(
//         { error: "Resume profile not found" },
//         { status: 400 },
//       );
//     }

//     // 3. Generate the Text (Pitch doesn't need 'Output.object' because it's just a string)
//     const { text } = await generateText({
//       //   model: google("gemini-3.1-flash-lite-preview"),
//       model: google("gemini-2.5-flash"),
//       system: `You are a high-end executive recruiter.
//                Write a 3-paragraph pitch.
//                Be specific, use the resume and job details provided.
//                Paragraph 1: Excitement about ${company}.
//                Paragraph 2: Evidence of fit using skills from the resume.
//                Paragraph 3: Call to action.`,
//       prompt: `RESUME: ${profile.resume_text}\n\nJOB: ${jobTitle} at ${company}\n\nDESC: ${jobDescription}`,
//     });

//     return NextResponse.json({ letter: text });
//   } catch (error: any) {
//     // Log the error to your terminal so you can see the "Real" reason for the 500
//     console.error("Cover Letter API Error:", error.message);
//     return NextResponse.json(
//       { error: "Failed to generate pitch" },
//       { status: 500 },
//     );
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text")
      .eq("id", "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d")
      .single();

    if (!profile?.resume_text) {
      return NextResponse.json({ error: "Resume missing" }, { status: 400 });
    }

    const { text } = await generateText({
      // model: google("gemini-1.5-flash-latest"),
      model: google("gemini-2.5-flash"),
      system: `You are the job applicant. Your name is Gabriel.
               Write a professional, persuasive 3-paragraph cover letter.
               
               STRICT WRITING RULES:
               - Write in the FIRST PERSON ("I am", "I have", "My experience").
               - NEVER refer to yourself in the third person (Avoid "As Gabriel...", use "I am...").
               - Do NOT act as a recruiter, agent, or third party. You ARE the candidate.
               - DYNAMIC CONTENT: Paragraph 2 must focus on the specific technical skills required in the JOB DESCRIPTION below and match them to your RESUME.
               - Tone: Professional, hungry, and clear.
               
               STRUCTURE:
               Paragraph 1: State clearly that you are applying for ${jobTitle} at ${company}.
               Paragraph 2: Deep dive into your relevant technical wins that solve the specific needs of this job.
               Paragraph 3: Professional closing and request for an interview.`,
      prompt: `RESUME: ${profile.resume_text}\n\nJOB TITLE: ${jobTitle}\n\nCOMPANY: ${company}\n\nJOB DESCRIPTION: ${jobDescription}`,
    });

    return NextResponse.json({ letter: text });
  } catch (error: any) {
    console.error("Cover Letter Error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
