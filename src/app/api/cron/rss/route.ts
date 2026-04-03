import { NextResponse } from "next/server";
import { Resend } from "resend";
import Parser from "rss-parser";
import { filterNewJobs } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);
const parser = new Parser();

const FEEDS = [
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
  "https://himalayas.app/jobs/rss",
  "https://remotive.com/feed",
  "https://remoteok.com/remote-jobs.rss",
  "https://nodesk.co/remote-jobs/index.xml",
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const allJobs: any[] = [];
  const lookbackDate = new Date();
  lookbackDate.setHours(lookbackDate.getHours() - 12);

  for (const url of FEEDS) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
        cache: "no-store",
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const feed = await parser.parseString(xml);

      const items = feed.items.map((item) => ({
        title: item.title,
        company: item.creator || item.author || "Remote Company",
        url: item.link,
        date: new Date(item.pubDate || item.isoDate || ""),
      }));

      allJobs.push(...items);
    } catch (e: any) {
      console.error(`RSS Fail for ${url}: ${e.message}`);
    }
  }

  const keywords = [
    "frontend",
    "front-end",
    "react",
    "typescript",
    "next.js",
    "javascript",
  ];
  const filtered = allJobs.filter(
    (j) =>
      j.date >= lookbackDate &&
      keywords.some((key) => j.title?.toLowerCase().includes(key)),
  );

  const uniqueJobs = Array.from(
    new Map(filtered.map((j) => [j.url, j])).values(),
  );

  // Filter against DB and save new ones with Metadata for Dashboard
  const newJobs = await filterNewJobs(uniqueJobs);

  console.log(
    `RSS Engine: ${uniqueJobs.length} found, ${newJobs.length} are new.`,
  );

  if (newJobs.length > 0) {
    await resend.emails.send({
      from: "JobBot <onboarding@resend.dev>",
      to: process.env.MY_EMAIL!,
      subject: `🏹 ${newJobs.length} NEW Niche Remote Roles`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #2563eb;">Fresh Niche Leads</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          ${newJobs
            .map(
              (j) => `
            <div style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
              <div style="font-size: 16px; font-weight: bold; color: #111;">${j.title}</div>
              <div style="color: #666; margin: 4px 0;">🏢 ${j.company}</div>
              <a href="${j.url}" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: bold;">View Posting →</a>
            </div>
          `,
            )
            .join("")}
        </div>
      `,
    });
  }

  return NextResponse.json({
    total_processed: uniqueJobs.length,
    new_sent: newJobs.length,
  });
}
