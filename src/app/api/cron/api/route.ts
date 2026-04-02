import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const SEARCH_QUERIES = [
  "frontend developer remote",
  "react engineer worldwide",
  "nextjs developer remote",
  "typescript developer global",
  "ui engineer remote",
  "web developer remote global",
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let allJobs: any[] = [];

  // We loop through multiple queries and request 2 pages each to get massive volume
  const apiPromises = SEARCH_QUERIES.map(async (query) => {
    try {
      const res = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&remote_jobs_only=true&date_posted=3days&page=1&num_pages=2`,
        {
          headers: {
            "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
          },
        },
      );
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      return [];
    }
  });

  const results = await Promise.all(apiPromises);
  results.forEach((group) => allJobs.push(...group));

  // Deduplicate and map
  const uniqueJobs = Array.from(
    new Map(
      allJobs.map((j: any) => [
        j.job_apply_link,
        {
          title: j.job_title,
          company: j.employer_name,
          url: j.job_apply_link,
          isDirect:
            j.job_apply_link.includes("lever.co") ||
            j.job_apply_link.includes("greenhouse.io"),
        },
      ]),
    ).values(),
  );

  if (uniqueJobs.length > 0) {
    // Sort so Direct applications are at the top
    const sorted = uniqueJobs.sort(
      (a: any, b: any) => (b.isDirect ? 1 : 0) - (a.isDirect ? 1 : 0),
    );

    await resend.emails.send({
      from: "JobBot <onboarding@resend.dev>",
      to: process.env.MY_EMAIL!,
      subject: `🌍 ${sorted.length} Global Aggregator Jobs Found`,
      html: sorted
        .map(
          (j: any) => `
        <p>
          ${j.isDirect ? "⭐ <strong>DIRECT APPLY:</strong> " : ""}
          <strong>${j.title}</strong> @ ${j.company}<br>
          <a href="${j.url}">Apply Now</a>
        </p>
      `,
        )
        .join(""),
    });
  }

  return NextResponse.json({ found: uniqueJobs.length });
}
