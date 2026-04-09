import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function ingestVCCompanies() {
  console.log("🍇 [VC Ingest] Synchronizing Portfolio Lists...");

  // 1. Fetch Firms
  const { data: firms } = await supabase.from("vc_firms").select("*");

  for (const firm of firms) {
    // For this example, we use a curated list of high-growth handles
    // discovered from their public job boards.
    let discoveryList = [];

    if (firm.name === "Sequoia") {
      discoveryList = [
        { name: "Notion", handle: "notion", type: "lever" },
        { name: "Figma", handle: "figma", type: "lever" },
        { name: "Vanta", handle: "vanta", type: "lever" },
        { name: "Stripe", handle: "stripe", type: "greenhouse" },
        { name: "Linear", handle: "linear", type: "lever" },
      ];
    } else if (firm.name === "Pear") {
      discoveryList = [
        { name: "Affinity", handle: "affinity", type: "greenhouse" },
        { name: "Viz.ai", handle: "vizai", type: "greenhouse" },
        { name: "Gusto", handle: "gusto", type: "greenhouse" },
      ];
    }

    for (const item of discoveryList) {
      const { error } = await supabase.from("vc_companies").upsert(
        {
          firm_id: firm.id,
          company_name: item.name,
          ats_handle: item.handle,
          ats_type: item.type,
        },
        { onConflict: "ats_handle" },
      );

      if (!error) console.log(`✅ Synced: ${item.name} (${firm.name})`);
    }
  }
}

ingestVCCompanies();
