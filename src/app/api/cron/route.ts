import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getDailyJobs } from "@/lib/jobFetcher";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // 1. Security check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const jobs = await getDailyJobs();
    console.log(`Found ${jobs.length} jobs.`); // This will show up in Vercel logs

    if (jobs.length === 0) {
      console.log("Skipping email because job list is empty.");
      return NextResponse.json({ message: "No new jobs today." });
    }

    // 2. Format the email body
    const emailHtml = `
      <h1>🚀 New Remote Frontend Jobs</h1>
      <ul>
        ${jobs
          .map(
            (job) => `
          <li>
            <strong>${job.title}</strong><br/>
            <a href="${job.link}">View Job Posting</a>
          </li>
        `,
          )
          .join("")}
      </ul>
    `;

    // 3. Send via Resend
    await resend.emails.send({
      from: "JobBot <onboarding@resend.dev>",
      to: process.env.MY_EMAIL!,
      subject: `Daily Job Alert: ${jobs.length} New Roles`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, count: jobs.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process jobs" },
      { status: 500 },
    );
  }
}
