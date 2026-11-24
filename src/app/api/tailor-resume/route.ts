import { NextResponse } from "next/server";
import { getResumeText, ResumeMissingError } from "@/lib/profile";
import { generateTailoredResumeData } from "@/lib/applications";

export async function POST(req: Request) {
  try {
    const { jobTitle, company, jobDescription } = await req.json();
    const resumeText = await getResumeText();

    const data = await generateTailoredResumeData(resumeText, {
      title: jobTitle,
      company,
      description: jobDescription,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error instanceof ResumeMissingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Tailor Error:", error);
    return NextResponse.json(
      { error: error.message || "Optimization failed" },
      { status: error.statusCode || 500 },
    );
  }
}
