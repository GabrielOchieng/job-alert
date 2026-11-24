import { Resend } from "resend";

let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/** Structured error log — one JSON line, easy to filter in Vercel's logs. */
export function logError(
  scope: string,
  error: unknown,
  meta: Record<string, unknown> = {},
) {
  const err = error as { message?: string; stack?: string } | undefined;
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      scope,
      message: err?.message || String(error),
      stack: err?.stack,
      ...meta,
    }),
  );
}

/**
 * Call from a cron/API route's catch block. Logs the failure as structured
 * JSON and emails a best-effort alert (reusing the Resend setup the routes
 * already have) — a cron route that silently 500s is otherwise invisible
 * unless someone happens to check Vercel's logs.
 */
export async function reportFailure(
  scope: string,
  error: unknown,
  meta: Record<string, unknown> = {},
) {
  logError(scope, error, meta);

  const to = process.env.MY_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;

  const err = error as { message?: string; stack?: string } | undefined;
  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: "App-Alerts <onboarding@resend.dev>",
      to,
      subject: `⚠️ ${scope} failed`,
      html: `
        <div style="font-family: monospace; background: #111827; color: #f8fafc; padding: 24px; border-left: 4px solid #ef4444;">
          <h2 style="color: #f87171; margin-top: 0;">Route Failure: ${scope}</h2>
          <p style="color: #9ca3af; font-size: 12px;">${new Date().toISOString()}</p>
          <pre style="white-space: pre-wrap; color: #fca5a5;">${err?.message || String(error)}</pre>
        </div>`,
    });
  } catch (alertErr) {
    console.error(`[${scope}] Failed to send failure alert:`, alertErr);
  }
}
