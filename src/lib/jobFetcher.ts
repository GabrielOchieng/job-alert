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

  for (const url of FEEDS) {
    const feed = await parser.parseURL(url);
    allJobs.push(...feed.items);
  }

  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - 2);

  return allJobs.filter((item) => {
    const pubDate = new Date(item.pubDate || "");
    // Filter for date AND ensure 'frontend' is in the title
    return (
      pubDate >= lookbackDate && item.title?.toLowerCase().includes("frontend")
    );
  });
}
