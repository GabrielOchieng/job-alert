import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isValidAdminPassword } from "@/lib/auth";
import { buildTailoredPdfBuffer } from "@/lib/pdf-helper";
import { reportFailure } from "@/lib/alert";

const bodySchema = z.object({
  jobId: z.string().min(1),
  adminPassword: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "jobId, adminPassword, subject and body are required" },
        { status: 400 },
      );
    }
    const { jobId, adminPassword, subject, body } = parsed.data;

    const correctPassword = process.env.ADMIN_PASSWORD;
    if (!correctPassword || !isValidAdminPassword(adminPassword, correctPassword)) {
      return NextResponse.json(
        { error: "Unauthorized Access", code: "ADMIN_ONLY" },
        { status: 401 },
      );
    }

    const fromAddress = process.env.APPLICATION_FROM_EMAIL;
    if (!fromAddress) {
      return NextResponse.json(
        {
          error:
            "APPLICATION_FROM_EMAIL is not set. Sending a real application requires a Resend-verified sending domain — see .env.example.",
        },
        { status: 500 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, company, application_email, application_draft")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (!job.application_email) {
      return NextResponse.json(
        { error: "This job has no application email set" },
        { status: 400 },
      );
    }
    if (!job.application_draft?.resume) {
      return NextResponse.json(
        { error: "Generate a draft before sending" },
        { status: 400 },
      );
    }

    const pdfBuffer = buildTailoredPdfBuffer(job.application_draft.resume, {
      company: job.company,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: fromAddress,
      to: job.application_email,
      subject,
      text: body,
      attachments: [
        {
          filename: `Gabriel_Ochieng_Resume_${job.company.replace(/\s+/g, "_")}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (sendError) {
      return NextResponse.json(
        { error: sendError.message || "Failed to send" },
        { status: 502 },
      );
    }

    const { error: updateError } = await supabase
      .from("jobs")
      .update({ status: "applied", application_sent_at: new Date().toISOString() })
      .eq("id", jobId);

    if (updateError) {
      console.error("Application sent, but failed to update job status:", updateError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await reportFailure("api/applications/send", error);
    return NextResponse.json(
      { error: error.message || "Send failed" },
      { status: error.statusCode || 500 },
    );
  }
}
