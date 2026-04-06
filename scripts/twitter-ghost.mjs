import { Scraper } from "@the-convocation/twitter-scraper";
import { Cookie } from "tough-cookie";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);
const resend = new Resend(process.env.RESEND_API_KEY);
const scraper = new Scraper();

async function runGhostScout() {
  console.log("👻 [Cipher Hunt] Initializing Ghost Session on X...");

  try {
    // 1. SESSION INJECTION
    // Get this string from Cookie-Editor extension (Header String format)
    const cookieString = process.env.TWITTER_COOKIES;
    if (!cookieString) throw new Error("Missing TWITTER_COOKIES secret.");

    const cookies = cookieString
      .split(";")
      .map((c) => Cookie.parse(c))
      .filter(Boolean);
    await scraper.setCookies(cookies);

    // Verify the ghost is alive
    const isLoggedIn = await scraper.isLoggedIn();
    if (!isLoggedIn) {
      console.error(
        "❌ Session Expired. You need to re-export your X cookies.",
      );
      return;
    }

    console.log("🔓 Session Authenticated. Scanning Live Timeline...");

    // 2. DIRECT DATA INTERCEPT
    // We search for tweets containing 'hiring' and 'frontend' with a direct link
    const query =
      'hiring "frontend" "remote" (lever.co OR greenhouse.io OR ashbyhq.com)';
    const tweets = await scraper.searchTweets(query, 15);

    const newLeads = [];

    // The scraper returns an async generator
    for await (const tweet of tweets) {
      const tweetUrl = `https://x.com/${tweet.username}/status/${tweet.id}`;

      // 3. CHECK COMMAND CENTER
      const { data: existing } = await supabase
        .from("jobs")
        .select("url")
        .eq("url", tweetUrl)
        .maybeSingle();

      if (!existing) {
        console.log(`➕ New Direct Lead: @${tweet.username}`);

        const { data: inserted, error: insErr } = await supabase
          .from("jobs")
          .insert([
            {
              title: "Frontend Role (Direct X)",
              company: `@${tweet.username}`,
              url: tweetUrl,
              location: "Remote (Ghost-Signal)",
              description: tweet.text.slice(0, 280),
              status: "new",
            },
          ])
          .select()
          .single();

        if (insErr) console.error("❌ DB Error:", insErr.message);
        else if (inserted) newLeads.push(inserted);
      }
    }

    // 4. ALERTING
    if (newLeads.length > 0) {
      console.log(`✅ ${newLeads.length} leads synced. Dispatching alert...`);
      await resend.emails.send({
        from: "CipherHunt-Ghost <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🎯 GHOST-SIGNAL: ${newLeads.length} Direct X Intercepts`,
        html: `
          <div style="background: #000; color: #0f0; padding: 20px; font-family: monospace;">
            <h2>[DIRECT ACCESS GRANTED]</h2>
            ${newLeads.map((l) => `<p>> ${l.company}: ${l.url}</p>`).join("")}
          </div>
        `,
      });
    } else {
      console.log("ℹ️ No new unique signals detected in this cycle.");
    }
  } catch (err) {
    console.error("❌ GHOST FAILURE:", err.message);
  }
}

runGhostScout();
