import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getResumeText, ResumeMissingError } from "@/lib/profile";
import { generateApplicationEmail, generateTailoredResumeData } from "@/lib/applications";
import { reportFailure } from "@/lib/alert";

const bodySchema = z.object({
  jobId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 },
      );
    }
    const { jobId } = parsed.data;

    const supabase = getSupabaseAdmin();
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, company, description, application_email")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (!job.application_email) {
      return NextResponse.json(
        { error: "Set an application email for this job first" },
        { status: 400 },
      );
    }

    const resumeText = await getResumeText();
    const jobInput = {
      title: job.title,
      company: job.company,
      description: job.description,
    };

    const [email, resume] = await Promise.all([
      generateApplicationEmail(resumeText, jobInput),
      generateTailoredResumeData(resumeText, jobInput),
    ]);

    const draft = { email, resume, generatedAt: new Date().toISOString() };

    const { error: updateError } = await supabase
      .from("jobs")
      .update({ application_draft: draft })
      .eq("id", jobId);

    if (updateError) {
      console.error("Failed to persist application draft:", updateError.message);
    }

    return NextResponse.json(draft);
  } catch (error: any) {
    if (error instanceof ResumeMissingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await reportFailure("api/applications/draft", error);
    return NextResponse.json(
      { error: error.message || "Draft generation failed" },
      { status: error.statusCode || 500 },
    );
  }
}
