// // import Parser from "rss-parser";

// // const parser = new Parser();
// // // const WWR_FEED =
// // //   "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss";

// // // export async function getDailyJobs() {
// // //   const feed = await parser.parseURL(WWR_FEED);
// // //   const today = new Date();
// // //   today.setHours(0, 0, 0, 0);

// // //   // Filter for jobs posted in the last 24 hours
// // //   return feed.items.filter((item) => {
// // //     const pubDate = new Date(item.pubDate || "");
// // //     return pubDate >= today;
// // //   });
// // // }

// // const FEEDS = [
// //   // This one is very reliable
// //   "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",

// //   // New Remotive Feed URL
// //   "https://remotive.com/remote-jobs/feed",

// //   // Broadened RemoteOK Feed
// //   "https://remoteok.com/remote-jobs.rss",

// //   // Fresh Feed for JS/Frontend roles
// //   "https://jsremotely.com/remote-jobs.rss",
// // ];

// // // export async function getDailyJobs() {
// // //   const allJobs = [];
// // //   const lookbackDate = new Date();
// // //   lookbackDate.setDate(lookbackDate.getDate() - 2); // 2 days lookback

// // //   for (const url of FEEDS) {
// // //     try {
// // //       console.log(`Fetching: ${url}`);
// // //       // Set a timeout for each request so one slow site doesn't kill the whole app
// // //       const feed = await parser.parseURL(url);

// // //       if (feed.items) {
// // //         allJobs.push(...feed.items);
// // //       }
// // //     } catch (error) {
// // //       // If one feed fails, we log it but DON'T stop the loop
// // //       console.error(`Failed to fetch ${url}:`, error);
// // //     }
// // //   }

// // //   console.log(`Total raw items found: ${allJobs.length}`);

// // //   const filteredJobs = allJobs.filter((item) => {
// // //     const pubDate = new Date(item.pubDate || item.isoDate || "");
// // //     const title = item.title?.toLowerCase() || "";

// // //     const isNewEnough = pubDate >= lookbackDate;
// // //     const isFrontend =
// // //       title.includes("frontend") ||
// // //       title.includes("react") ||
// // //       title.includes("typescript");

// // //     return isNewEnough && isFrontend;
// // //   });

// // //   // Deduplicate: Sometimes the same job is on multiple boards
// // //   const uniqueJobs = Array.from(
// // //     new Map(filteredJobs.map((item) => [item.link, item])).values(),
// // //   );

// // //   console.log(`Final filtered jobs: ${uniqueJobs.length}`);
// // //   return uniqueJobs;
// // // }

// // export async function getDailyJobs() {
// //   const allJobs = [];
// //   const lookbackDate = new Date();
// //   lookbackDate.setDate(lookbackDate.getDate() - 5); // Increased to 5 days for robustness

// //   for (const url of FEEDS) {
// //     try {
// //       console.log(`Fetching: ${url}`);
// //       const feed = await parser.parseURL(url);
// //       if (feed.items) allJobs.push(...feed.items);
// //     } catch (error) {
// //       console.error(`Failed to fetch ${url}. Moving on...`);
// //     }
// //   }

// //   const filteredJobs = allJobs.filter((item) => {
// //     const pubDate = new Date(item.pubDate || item.isoDate || "");
// //     const title = item.title?.toLowerCase() || "";

// //     // We want Frontend OR React OR Next.js OR Senior/Lead roles
// //     const keywords = [
// //       "frontend",
// //       "front-end",
// //       "react",
// //       "typescript",
// //       "next.js",
// //       "nextjs",
// //       "javascript",
// //     ];
// //     const hasKeyword = keywords.some((key) => title.includes(key));

// //     return pubDate >= lookbackDate && hasKeyword;
// //   });

// //   // Log the titles of filtered jobs to the Vercel console for debugging
// //   filteredJobs.forEach((j) => console.log(`Matched: ${j.title}`));

// //   const uniqueJobs = Array.from(
// //     new Map(filteredJobs.map((item) => [item.link, item])).values(),
// //   );

// //   return uniqueJobs;
// // }

// // lib/jobFetcher.ts
// import Parser from "rss-parser";

// const parser = new Parser();
// const FEEDS = [
//   "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
//   "https://remotive.com/feed",
//   "https://remoteok.com/remote-jobs.rss",
// ];

// export async function getDailyJobs() {
//   const allJobs: any[] = [];
//   const lookbackDate = new Date();
//   lookbackDate.setDate(lookbackDate.getDate() - 3);

//   // 1. THE RSS FETCH (Your existing logic)
//   for (const url of FEEDS) {
//     try {
//       const feed = await parser.parseURL(url);
//       const items = feed.items.map((item) => ({
//         title: item.title,
//         company: item.creator || "Remote Board",
//         url: item.link,
//         date: new Date(item.pubDate || item.isoDate || ""),
//       }));
//       allJobs.push(...items);
//     } catch (e) {
//       console.error(`RSS Error ${url}:`, e);
//     }
//   }

//   // 2. THE API FETCH (The "Many Jobs" Engine)
//   try {
//     const response = await fetch(
//       "https://jsearch.p.rapidapi.com/search?query=frontend%20developer&remote_jobs_only=true&date_posted=3days",
//       {
//         headers: {
//           "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
//           "x-rapidapi-host": "jsearch.p.rapidapi.com",
//         },
//       },
//     );
//     const apiData = await response.json();

//     if (apiData.data) {
//       const apiJobs = apiData.data.map((job: any) => ({
//         title: job.job_title,
//         company: job.employer_name,
//         url: job.job_apply_link,
//         date: new Date(job.job_posted_at_datetime_utc),
//       }));
//       allJobs.push(...apiJobs);
//     }
//   } catch (e) {
//     console.error("JSearch API Error:", e);
//   }

//   // 3. ROBUST FILTERING
//   const keywords = [
//     "frontend",
//     "front-end",
//     "react",
//     "typescript",
//     "next.js",
//     "javascript",
//   ];

//   const filtered = allJobs.filter((job) => {
//     const title = job.title?.toLowerCase() || "";
//     const isNew = job.date >= lookbackDate;
//     const hasKeyword = keywords.some((k) => title.includes(k));
//     return isNew && hasKeyword;
//   });

//   // Deduplicate by URL
//   return Array.from(new Map(filtered.map((j) => [j.url, j])).values());
// }

import Parser from "rss-parser";

const parser = new Parser();

// 1. Expanded RSS List (The most active boards for 2026)
const FEEDS = [
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
  "https://remotive.com/feed",
  "https://remoteok.com/remote-jobs.rss",
  "https://jsremotely.com/remote-jobs.rss",
  "https://dailyremote.com/remote-frontend-developer-jobs/feed",
  "https://nodesk.co/remote-jobs/frontend/index.xml",
  "https://remote-leaf.com/feed",
  "https://www.workingnomads.com/jobsfeed",
  "https://jobspresso.co/category/dev/feed/",
];

// 2. Multi-Query Search (This is where the 'hundreds' come from)
// const SEARCH_QUERIES = [
//   "frontend developer remote global",
//   "react engineer worldwide",
//   "typescript nextjs developer remote",
//   "senior frontend developer anywhere",
//   "javascript engineer remote worldwide",
// ];

const SEARCH_QUERIES = [
  "frontend engineer remote",
  "frontend developer remote",
  "react engineer remote",
  "nextjs developer remote",
  "javascript engineer remote",
  "ui engineer remote",
  "web developer remote",
  "software engineer frontend remote",
  "fullstack developer react remote", // Many 'fullstack' roles are frontend-heavy
];

export async function getDailyJobs() {
  const allJobs: any[] = [];
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - 3);

  // --- PART A: PARALLEL RSS FETCH ---
  const rssPromises = FEEDS.map(async (url) => {
    try {
      const feed = await parser.parseURL(url);
      return feed.items.map((item) => ({
        title: item.title,
        company: item.creator || item.author || "Remote Board",
        url: item.link,
        date: new Date(item.pubDate || item.isoDate || ""),
        source: "RSS",
      }));
    } catch (e) {
      console.error(`RSS Error ${url}:`, e);
      return [];
    }
  });

  // --- PART B: MULTI-QUERY API FETCH ---
  const apiPromises = SEARCH_QUERIES.map(async (query) => {
    try {
      const response = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&remote_jobs_only=true&date_posted=3days&num_pages=3`,
        {
          headers: {
            "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
            "x-rapidapi-host": "jsearch.p.rapidapi.com",
          },
        },
      );
      const apiData = await response.json();
      if (!apiData.data) return [];

      return apiData.data.map((job: any) => ({
        title: job.job_title,
        company: job.employer_name,
        url: job.job_apply_link,
        date: new Date(job.job_posted_at_datetime_utc || Date.now()),
        source: job.job_publisher || "Direct/API",
      }));
    } catch (e) {
      console.error(`API Error for query "${query}":`, e);
      return [];
    }
  });

  // Execute all fetches in parallel for speed
  const results = await Promise.all([...rssPromises, ...apiPromises]);
  results.forEach((jobGroup) => allJobs.push(...jobGroup));

  // --- PART C: ROBUST FILTERING ---
  const keywords = [
    "frontend",
    "front-end",
    "react",
    "typescript",
    "next.js",
    "nextjs",
    "javascript",
    "web",
  ];

  const filtered = allJobs.filter((job) => {
    const title = job.title?.toLowerCase() || "";
    const isNew = job.date >= lookbackDate;
    const hasKeyword = keywords.some((k) => title.includes(k));

    // Safety check: Filter out 'Junior' or 'Intern' if you only want pro roles (optional)
    // const isNotJunior = !title.includes("junior") && !title.includes("intern");

    return isNew && hasKeyword;
  });

  // Deduplicate by URL (Vital when searching across multiple queries)
  const uniqueJobs = Array.from(
    new Map(filtered.map((j) => [j.url, j])).values(),
  );

  // Sort: Put Direct listings (from Lever/Greenhouse) or newest first
  return uniqueJobs.sort((a, b) => b.date.getTime() - a.date.getTime());
}
