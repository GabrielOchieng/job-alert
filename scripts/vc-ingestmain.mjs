// import FirecrawlApp from "@mendable/firecrawl-js";
// import { createClient } from "@supabase/supabase-js";
// import dotenv from "dotenv";

// dotenv.config();

// const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_KEY,
// );

// async function ingestVCPortfolios() {
//   const targets = [
//     { name: "Sequoia", url: "https://sequoiacap.com/our-companies/" },
//     { name: "Pear", url: "https://pear.vc/companies/" },
//   ];

//   for (const target of targets) {
//     console.log(`📡 [Ingest] Scraping ${target.name} portfolio...`);

//     // Scrape the page for company names and website links
//     const scrape = await firecrawl.scrape(target.url, {
//       formats: ["markdown"],
//       waitFor: 3000,
//     });

//     // Simple cleaning logic: Find lines that look like company names
//     // Note: You can refine this regex or use an LLM extraction here
//     const lines = scrape.markdown.split("\n");
//     const companies = lines
//       .filter(
//         (line) => line.length > 2 && line.length < 40 && !line.includes("http"),
//       )
//       .map((name) => name.trim().replace(/[^a-zA-Z0-9\s]/g, ""));

//     console.log(
//       `🔍 Found ${companies.length} potential companies for ${target.name}.`,
//     );

//     for (const name of companies) {
//       const { error } = await supabase.from("vc_portfolio_companies").upsert(
//         {
//           company_name: name,
//           vc_firm: target.name,
//           is_active: true,
//         },
//         { onConflict: "company_name" },
//       );

//       if (!error) console.log(`✅ Logged: ${name}`);
//     }
//   }
// }

// ingestVCPortfolios();

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
    {
      name: "Sequoia",
      url: "https://sequoiacap.com/our-companies/?_spotlight=1#all-panel/",
    },
    {
      name: "Pear",
      url: "https://pear.vc/companies/?query_filter_id=3&filter_slug=all-companies/",
    },
  ];

  for (const target of targets) {
    console.log(`📡 [Ingest] Deep-scanning ${target.name} portfolio...`);

    try {
      // 1. We use 'extract' mode instead of 'scrape' for better entity recognition
      const extractResult = await firecrawl.scrape(target.url, {
        formats: ["json"],
        // 2. We force it to scroll several times to bypass the "Spotlight" section
        actions: [
          { type: "scroll", direction: "bottom" },
          { type: "wait", milliseconds: 1500 },
          { type: "scroll", direction: "bottom" },
          { type: "wait", milliseconds: 1500 },
          { type: "scroll", direction: "bottom" },
        ],
        jsonOptions: {
          schema: {
            type: "object",
            properties: {
              companies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    website: { type: "string" },
                  },
                  required: ["name"],
                },
              },
            },
          },
        },
      });

      if (!extractResult.success) {
        console.error(
          `❌ Failed to extract ${target.name}:`,
          extractResult.error,
        );
        continue;
      }

      const foundCompanies = extractResult.json.companies || [];
      console.log(
        `🔍 AI identified ${foundCompanies.length} companies for ${target.name}.`,
      );

      // 3. Save to DB
      for (const company of foundCompanies) {
        // Sanitize the name: Remove extra whitespace or junk
        const cleanName = company.name.trim();
        if (cleanName.length < 2) continue;

        const { error } = await supabase.from("vc_portfolio_companies").upsert(
          {
            company_name: cleanName,
            vc_firm: target.name,
            website_url: company.website || null,
            is_active: true,
          },
          { onConflict: "company_name" },
        );

        if (!error) {
          // console.log(`✅ Logged: ${cleanName}`);
        }
      }

      console.log(`✨ Successfully updated ${target.name} database entries.`);
    } catch (err) {
      console.error(
        `⚠️ Fatal error during ${target.name} ingest:`,
        err.message,
      );
    }
  }
}

ingestVCPortfolios();
