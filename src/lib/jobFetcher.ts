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
  // 1. We Work Remotely (The Gold Standard)
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",

  // 2. Remotive (Very high-quality tech roles)
  "https://remotive.com/remote-jobs/feed/software-dev",

  // 3. Working Nomads (Great for global/digital nomad roles)
  "https://www.workingnomads.com/jobs?category=development&tags=frontend&location=anywhere&format=rss",

  // 4. Jobspresso (Curated remote jobs)
  "https://jobspresso.co/category/dev/feed/",

  // 5. Authentic Jobs (Often has high-end React/Frontend roles)
  "https://authenticjobs.com/category/development/feed/",

  // 6. Stack Overflow / Discover (via specialized remote aggregators)
  "https://remoteok.com/remote-frontend-jobs.rss",
];

export async function getDailyJobs() {
  const allJobs = [];
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - 2); // 2 days lookback

  for (const url of FEEDS) {
    try {
      console.log(`Fetching: ${url}`);
      // Set a timeout for each request so one slow site doesn't kill the whole app
      const feed = await parser.parseURL(url);

      if (feed.items) {
        allJobs.push(...feed.items);
      }
    } catch (error) {
      // If one feed fails, we log it but DON'T stop the loop
      console.error(`Failed to fetch ${url}:`, error);
    }
  }

  console.log(`Total raw items found: ${allJobs.length}`);

  const filteredJobs = allJobs.filter((item) => {
    const pubDate = new Date(item.pubDate || item.isoDate || "");
    const title = item.title?.toLowerCase() || "";

    const isNewEnough = pubDate >= lookbackDate;
    const isFrontend =
      title.includes("frontend") ||
      title.includes("react") ||
      title.includes("typescript");

    return isNewEnough && isFrontend;
  });

  // Deduplicate: Sometimes the same job is on multiple boards
  const uniqueJobs = Array.from(
    new Map(filteredJobs.map((item) => [item.link, item])).values(),
  );

  console.log(`Final filtered jobs: ${uniqueJobs.length}`);
  return uniqueJobs;
}
