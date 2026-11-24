// scripts/lib/notify.mjs
//
// Shared Resend notification for the scraper scripts. Every scraper built
// its own "new leads" email inline, all following the same
// "{emoji} {ScoutName}: {n} {description}" subject pattern and a near
// identical card-per-job HTML layout. This module gives them one place to
// send that from.
import { Resend } from "resend";

let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;
  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/** Default job card: title, company, apply link. */
export function defaultJobCard(job) {
  return `
    <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;">
      <strong style="color: #2563eb; font-size: 1.05em;">${job.title || "Untitled role"}</strong><br>
      <span style="color: #475569;">${job.company || "Unknown company"}</span><br>
      <a href="${job.url}" style="color: #059669; font-weight: bold; text-decoration: none;">View / Apply →</a>
    </div>`;
}

/**
 * Sends a "new leads found" email. No-ops (and sends nothing) when `jobs`
 * is empty, matching every scraper's previous `if (newJobs.length > 0)` guard.
 *
 * @param {object} opts
 * @param {string} opts.from - e.g. "Dexa-Alerts <onboarding@resend.dev>"
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.heading - shown as the email's <h2>
 * @param {any[]} opts.jobs
 * @param {(job: any) => string} [opts.renderCard] - override the per-job HTML
 * @param {string} [opts.note] - optional line shown under the heading (e.g. source URL)
 * @param {(jobs: any[]) => string} [opts.renderHtml] - override the ENTIRE email body,
 *   for a script whose template differs more than a card swap (e.g. a distinct
 *   color scheme). When provided, `heading`/`note`/`renderCard` are ignored.
 */
export async function sendNewLeadsEmail({
  from,
  to,
  subject,
  heading,
  jobs,
  renderCard = defaultJobCard,
  renderHtml,
  note,
}) {
  if (!jobs || jobs.length === 0) return { sent: false, reason: "no-jobs" };

  const resend = getResendClient();
  const html = renderHtml
    ? renderHtml(jobs)
    : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #0f172a;">${heading}</h2>
      ${note ? `<p style="color: #64748b; font-size: 13px;">${note}</p>` : ""}
      <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
      ${jobs.map(renderCard).join("")}
    </div>`;

  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    console.error("sendNewLeadsEmail failed:", error.message || error);
    return { sent: false, reason: error.message || "unknown-error" };
  }
  return { sent: true };
}
