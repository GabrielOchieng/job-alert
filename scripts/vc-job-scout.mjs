import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import pLimit from "p-limit";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);
const limit = pLimit(10); // Check 10 companies at once
const FRONTEND_FILTER = /frontend|react|typescript|nextjs|javascript/i;

async function runPortfolioScout() {
  const { data: companies } = await supabase
    .from("vc_portfolio_companies")
    .select("*")
    .eq("is_active", true);

  console.log(`🕵️‍♂️ Scouting ${companies.length} VC companies for signals...`);

  const tasks = companies.map((company) =>
    limit(async () => {
      // 1. Try to find the handle if we don't have it
      const handle =
        company.ats_handle ||
        company.company_name.toLowerCase().replace(/\s/g, "");

      // Check Greenhouse
      const ghRes = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${handle}/jobs`,
      );
      if (ghRes.ok) {
        const data = await ghRes.json();
        return { jobs: data.jobs || [], type: "greenhouse", handle, company };
      }

      // Check Lever
      const lvRes = await fetch(
        `https://api.lever.co/v0/postings/${handle}?mode=json`,
      );
      if (lvRes.ok) {
        const data = await lvRes.json();
        return { jobs: data || [], type: "lever", handle, company };
      }

      return null;
    }),
  );

  const results = await Promise.all(tasks);

  for (const res of results.filter((r) => r !== null)) {
    // Save the discovered handle for next time
    await supabase
      .from("vc_portfolio_companies")
      .update({
        ats_handle: res.handle,
        ats_type: res.type,
        last_scanned: new Date(),
      })
      .eq("id", res.company.id);

    // Filter and save actual jobs
    const matches = res.jobs.filter((j) =>
      FRONTEND_FILTER.test(j.title || j.text),
    );

    for (const job of matches) {
      const url = job.absolute_url || job.hostedUrl;
      const { data: exists } = await supabase
        .from("jobs")
        .select("id")
        .eq("url", url)
        .maybeSingle();

      if (!exists) {
        await supabase.from("jobs").insert([
          {
            title: job.title || job.text,
            company: res.company.company_name,
            url: url,
            location: job.location?.name || "Remote",
            source: `vc-${res.company.vc_firm.toLowerCase()}`,
            status: "new",
          },
        ]);
        console.log(
          `✨ FOUND TIER-1 LEAD: ${job.title} at ${res.company.company_name}`,
        );
      }
    }
  }
}

runPortfolioScout();
