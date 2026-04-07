import { NextResponse } from "next/server";
import { Resend } from "resend";
import { filterNewJobs } from "@/lib/supabase";
import { isWorldwide } from "@/lib/filters";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // 1. Auth Guard
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("🌍 [Global Scout] Initiating Free API Hunt...");
  let rawJobs: any[] = [];

  try {
    // 2. Fetch from Himalayas (Native Global API - No Key Required)
    // --- Inside your fetch block ---
    const himalayasRes = await fetch(
      "https://himalayas.app/jobs/api?candidate_location=Worldwide&worldwide=true",
      { next: { revalidate: 0 } },
    );
    const himalayasData = await himalayasRes.json();
    const hJobs = himalayasData.jobs.map((j: any) => ({
      title: j.title,
      company: j.company_name,
      url: j.application_link || j.link,
      isDirect: true, // Himalayas usually goes straight to the source
    }));
    rawJobs.push(...hJobs);

    // 3. Fetch from Remotive (Software Dev Category)
    const remotiveRes = await fetch(
      "https://remotive.com/api/remote-jobs?category=software-dev",
      {
        next: { revalidate: 0 },
      },
    );
    const remotiveData = await remotiveRes.json();
    const rJobs = remotiveData.jobs.map((j: any) => ({
      title: j.title,
      company: j.company_name,
      url: j.url,
      isDirect: /lever\.co|greenhouse\.io|workable\.com|ashbyhq\.com/.test(
        j.url.toLowerCase(),
      ),
    }));
    rawJobs.push(...rJobs);
  } catch (error) {
    console.error("❌ API Fetch Error:", error);
  }

  // 4. Filter for Frontend Keywords & Worldwide Status
  const keywords = [
    "frontend",
    "react",
    "typescript",
    "nextjs",
    "javascript",
    "tailwind",
  ];

  const highSignalJobs = rawJobs.filter((j) => {
    const hasKeyword = keywords.some((k) => j.title.toLowerCase().includes(k));
    const passesBouncer = isWorldwide(j.title, j.company);
    return hasKeyword && passesBouncer;
  });

  // 5. Remove internal duplicates from the current fetch
  const uniqueJobs = Array.from(
    new Map(highSignalJobs.map((j) => [j.url, j])).values(),
  );

  // 6. Cross-reference with Supabase to only get truly NEW jobs
  const newJobs = await filterNewJobs(uniqueJobs);

  // 7. Alerting
  if (newJobs.length > 0) {
    await resend.emails.send({
      from: "GlobalScout <onboarding@resend.dev>",
      to: process.env.MY_EMAIL!,
      subject: `🌍 ${newJobs.length} NEW Global Tech Roles`,
      html: `
        <div style="font-family: monospace; background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a;">[GLOBAL API INTERCEPT]</h2>
          <p style="color: #64748b;">Source: Himalayas & Remotive (Worldwide Only)</p>
          <hr />
          ${newJobs
            .map(
              (j) => `
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;">
              <strong style="color: #2563eb;">${j.title}</strong><br>
              <span style="color: #475569;">${j.company}</span><br>
              <a href="${j.url}" style="color: #059669; font-weight: bold; text-decoration: none;">[APPLY NOW →]</a>
            </div>
          `,
            )
            .join("")}
        </div>
      `,
    });
  }

  return NextResponse.json({
    scanned: rawJobs.length,
    high_signal: uniqueJobs.length,
    new_dispatched: newJobs.length,
  });
}
