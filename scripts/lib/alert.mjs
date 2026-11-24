// scripts/lib/alert.mjs
//
// These scrapers run unattended on a GitHub Actions schedule. Before this,
// a failure just printed to a log nobody was watching, and the workflow
// still exited 0 (success) — so a broken scraper could sit silently broken
// for weeks. This gives every script one call that: logs the failure as
// structured JSON (greppable in the Actions log), emails a failure alert
// (reusing the Resend setup the scripts already have), and sets a non-zero
// exit code so the GitHub Actions run itself shows red.
import { Resend } from "resend";

let resendClient = null;
function getResendClient() {
  if (resendClient) return resendClient;
  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/** Structured error log — one JSON line, easy to grep/filter in CI logs. */
export function logError(scope, error, meta = {}) {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      scope,
      message: error?.message || String(error),
      stack: error?.stack,
      ...meta,
    }),
  );
}

/**
 * Call from a script's top-level catch block. Logs the failure, emails an
 * alert (best-effort — a failed alert never masks the original error), and
 * sets process.exitCode so the workflow run itself is marked as failed.
 */
export async function reportFailure(scope, error, meta = {}) {
  logError(scope, error, meta);
  process.exitCode = 1;

  const to = process.env.MY_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: "Scraper-Alerts <onboarding@resend.dev>",
      to,
      subject: `⚠️ ${scope} failed`,
      html: `
        <div style="font-family: monospace; background: #111827; color: #f8fafc; padding: 24px; border-left: 4px solid #ef4444;">
          <h2 style="color: #f87171; margin-top: 0;">Scraper Failure: ${scope}</h2>
          <p style="color: #9ca3af; font-size: 12px;">${new Date().toISOString()}</p>
          <pre style="white-space: pre-wrap; color: #fca5a5;">${error?.message || String(error)}</pre>
          ${error?.stack ? `<pre style="white-space: pre-wrap; color: #6b7280; font-size: 11px;">${error.stack}</pre>` : ""}
        </div>`,
    });
  } catch (alertErr) {
    console.error(`[${scope}] Failed to send failure alert:`, alertErr.message);
  }
}
