import { NextResponse } from "next/server";
import { Resend } from "resend";
import Parser from "rss-parser";

const resend = new Resend(process.env.RESEND_API_KEY);
const parser = new Parser();

const FEEDS = [
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
  "https://remotive.com/feed",
  "https://remoteok.com/remote-jobs.rss",
  "https://jsremotely.com/remote-jobs.rss",
  "https://dailyremote.com/remote-frontend-developer-jobs/feed",
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const allJobs = [];
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - 2);

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      const items = feed.items.map((item) => ({
        title: item.title,
        company: item.creator || "Remote Board",
        url: item.link,
        date: new Date(item.pubDate || item.isoDate || ""),
      }));
      allJobs.push(...items);
    } catch (e) {
      console.error(`RSS Error: ${url}`);
    }
  }

  const filtered = allJobs.filter(
    (j) =>
      j.date >= lookbackDate &&
      (j.title?.toLowerCase().includes("frontend") ||
        j.title?.toLowerCase().includes("react")),
  );

  const uniqueJobs = Array.from(
    new Map(filtered.map((j) => [j.url, j])).values(),
  );

  if (uniqueJobs.length > 0) {
    await resend.emails.send({
      from: "JobBot <onboarding@resend.dev>",
      to: process.env.MY_EMAIL!,
      subject: `🏹 ${uniqueJobs.length} Niche Remote Jobs Found`,
      html: uniqueJobs
        .map(
          (j) =>
            `<p><strong>${j.title}</strong> @ ${j.company}<br><a href="${j.url}">Link</a></p>`,
        )
        .join(""),
    });
  }

  return NextResponse.json({ found: uniqueJobs.length });
}
