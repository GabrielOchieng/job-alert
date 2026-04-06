import { Scraper } from "@the-convocation/twitter-scraper";
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
    // 1. SESSION INJECTION (Simplified String Array)
    const cookieString = process.env.TWITTER_COOKIES;
    if (!cookieString) throw new Error("Missing TWITTER_COOKIES secret.");

    // The scraper expects an array of "key=value" strings
    const cookieArray = cookieString
      .split(";")
      .map((c) => c.trim())
      .filter((c) => c.includes("="));

    await scraper.setCookies(cookieArray);

    // Verify authentication
    const isLoggedIn = await scraper.isLoggedIn();
    if (!isLoggedIn) {
      console.error(
        "❌ Session Failed. Your TWITTER_COOKIES might be expired or malformed.",
      );
      return;
    }

    console.log("🔓 Session Authenticated. Scanning Live Feed...");

    // 2. DIRECT DATA INTERCEPT
    const query =
      'hiring "frontend" "remote" (lever.co OR greenhouse.io OR ashbyhq.com)';

    // Fetching 20 tweets to ensure we get a good sample
    const tweets = await scraper.searchTweets(query, 20);
    const newLeads = [];

    for await (const tweet of tweets) {
      const tweetUrl = `https://x.com/${tweet.username}/status/${tweet.id}`;

      // 3. DATABASE SYNC
      const { data: existing } = await supabase
        .from("jobs")
        .select("url")
        .eq("url", tweetUrl)
        .maybeSingle();

      if (!existing) {
        console.log(`➕ New Direct Signal: @${tweet.username}`);

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

        if (insErr) {
          console.error("❌ Supabase Insert Error:", insErr.message);
        } else if (inserted) {
          newLeads.push(inserted);
        }
      } else {
        console.log(`⏭️ Signal already indexed: @${tweet.username}`);
      }
    }

    // 4. THEMED ALERTING
    if (newLeads.length > 0) {
      console.log(
        `✅ ${newLeads.length} leads synced. Dispatching Ghost Alert...`,
      );

      const { data, error } = await resend.emails.send({
        from: "CipherHunt-Ghost <onboarding@resend.dev>",
        to: process.env.MY_EMAIL,
        subject: `🎯 GHOST-SIGNAL: ${newLeads.length} Direct X Intercepts`,
        html: `
          <div style="background: #020617; color: #f8fafc; padding: 40px; font-family: monospace; border-left: 4px solid #10b981;">
            <h1 style="color: #10b981; font-size: 18px;">[DIRECT ACCESS GRANTED]</h1>
            <p style="color: #94a3b8; font-size: 14px;">Real-time hiring data extracted from X session.</p>
            <hr style="border: 0.5px solid #1e293b; margin: 20px 0;" />
            ${newLeads
              .map(
                (l) => `
              <div style="margin-bottom: 25px; border-bottom: 1px dashed #1e293b; padding-bottom: 15px;">
                <div style="font-weight: bold; font-size: 16px;">${l.title}</div>
                <div style="color: #10b981; margin: 5px 0;">Source: ${l.company}</div>
                <a href="${l.url}" style="color: #38bdf8; text-decoration: none; font-size: 12px;">[INTERCEPT SIGNAL →]</a>
              </div>
            `,
              )
              .join("")}
            <p style="font-size: 10px; color: #475569; margin-top: 30px;">Transmission secure. Agent Ghost out.</p>
          </div>
        `,
      });

      if (error) console.error("❌ Email Error:", error.message);
      else console.log("📨 Ghost alert sent! ID:", data.id);
    } else {
      console.log("ℹ️ No new unique signals detected in this sector.");
    }
  } catch (err) {
    console.error("❌ GHOST FAILURE:", err.message);
  }
}

runGhostScout();
