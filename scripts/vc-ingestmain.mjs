import FirecrawlApp from "@mendable/firecrawl-js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function ingestVCPortfolios() {
  const targets = [
    { name: "Sequoia", url: "https://sequoiacap.com/our-companies/" },
    { name: "Pear", url: "https://pear.vc/companies/" },
  ];

  for (const target of targets) {
    console.log(`📡 [Ingest] Scraping ${target.name} portfolio...`);

    // Scrape the page for company names and website links
    const scrape = await firecrawl.scrape(target.url, {
      formats: ["markdown"],
      waitFor: 3000,
    });

    // Simple cleaning logic: Find lines that look like company names
    // Note: You can refine this regex or use an LLM extraction here
    const lines = scrape.markdown.split("\n");
    const companies = lines
      .filter(
        (line) => line.length > 2 && line.length < 40 && !line.includes("http"),
      )
      .map((name) => name.trim().replace(/[^a-zA-Z0-9\s]/g, ""));

    console.log(
      `🔍 Found ${companies.length} potential companies for ${target.name}.`,
    );

    for (const name of companies) {
      const { error } = await supabase.from("vc_portfolio_companies").upsert(
        {
          company_name: name,
          vc_firm: target.name,
          is_active: true,
        },
        { onConflict: "company_name" },
      );

      if (!error) console.log(`✅ Logged: ${name}`);
    }
  }
}

ingestVCPortfolios();
