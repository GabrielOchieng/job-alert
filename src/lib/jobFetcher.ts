import Parser from "rss-parser";

const parser = new Parser();
const WWR_FEED =
  "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss";

export async function getDailyJobs() {
  const feed = await parser.parseURL(WWR_FEED);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter for jobs posted in the last 24 hours
  return feed.items.filter((item) => {
    const pubDate = new Date(item.pubDate || "");
    return pubDate >= today;
  });
}
