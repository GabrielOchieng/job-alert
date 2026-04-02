import Parser from "rss-parser";

const parser = new Parser();
// const WWR_FEED =
//   "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss";

// export async function getDailyJobs() {
//   const feed = await parser.parseURL(WWR_FEED);
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   // Filter for jobs posted in the last 24 hours
//   return feed.items.filter((item) => {
//     const pubDate = new Date(item.pubDate || "");
//     return pubDate >= today;
//   });
// }

const FEEDS = [
  // This one is very reliable
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",

  // New Remotive Feed URL
  "https://remotive.com/remote-jobs/feed",

  // Broadened RemoteOK Feed
  "https://remoteok.com/remote-jobs.rss",

  // Fresh Feed for JS/Frontend roles
  "https://jsremotely.com/remote-jobs.rss",
];

// export async function getDailyJobs() {
//   const allJobs = [];
//   const lookbackDate = new Date();
//   lookbackDate.setDate(lookbackDate.getDate() - 2); // 2 days lookback

//   for (const url of FEEDS) {
//     try {
//       console.log(`Fetching: ${url}`);
//       // Set a timeout for each request so one slow site doesn't kill the whole app
//       const feed = await parser.parseURL(url);

//       if (feed.items) {
//         allJobs.push(...feed.items);
//       }
//     } catch (error) {
//       // If one feed fails, we log it but DON'T stop the loop
//       console.error(`Failed to fetch ${url}:`, error);
//     }
//   }

//   console.log(`Total raw items found: ${allJobs.length}`);

//   const filteredJobs = allJobs.filter((item) => {
//     const pubDate = new Date(item.pubDate || item.isoDate || "");
//     const title = item.title?.toLowerCase() || "";

//     const isNewEnough = pubDate >= lookbackDate;
//     const isFrontend =
//       title.includes("frontend") ||
//       title.includes("react") ||
//       title.includes("typescript");

//     return isNewEnough && isFrontend;
//   });

//   // Deduplicate: Sometimes the same job is on multiple boards
//   const uniqueJobs = Array.from(
//     new Map(filteredJobs.map((item) => [item.link, item])).values(),
//   );

//   console.log(`Final filtered jobs: ${uniqueJobs.length}`);
//   return uniqueJobs;
// }

export async function getDailyJobs() {
  const allJobs = [];
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - 5); // Increased to 5 days for robustness

  for (const url of FEEDS) {
    try {
      console.log(`Fetching: ${url}`);
      const feed = await parser.parseURL(url);
      if (feed.items) allJobs.push(...feed.items);
    } catch (error) {
      console.error(`Failed to fetch ${url}. Moving on...`);
    }
  }

  const filteredJobs = allJobs.filter((item) => {
    const pubDate = new Date(item.pubDate || item.isoDate || "");
    const title = item.title?.toLowerCase() || "";

    // We want Frontend OR React OR Next.js OR Senior/Lead roles
    const keywords = [
      "frontend",
      "front-end",
      "react",
      "typescript",
      "next.js",
      "nextjs",
      "javascript",
    ];
    const hasKeyword = keywords.some((key) => title.includes(key));

    return pubDate >= lookbackDate && hasKeyword;
  });

  // Log the titles of filtered jobs to the Vercel console for debugging
  filteredJobs.forEach((j) => console.log(`Matched: ${j.title}`));

  const uniqueJobs = Array.from(
    new Map(filteredJobs.map((item) => [item.link, item])).values(),
  );

  return uniqueJobs;
}
