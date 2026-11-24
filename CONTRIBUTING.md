# Contributing

This is a personal job-tracking tool: a Next.js dashboard backed by Supabase,
plus a set of standalone scraper scripts run on a schedule by GitHub Actions.
There's no multi-user support — the whole app is scoped to a single
hardcoded profile.

## Setup

1. Node 22 (matches the version pinned in `.github/workflows/*.yml`).
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in the values. See that
   file's comments for what each one does and which parts of the app use
   it. At minimum, for the dashboard to run you need the two
   `NEXT_PUBLIC_SUPABASE_*` vars and `SUPABASE_URL` / `SUPABASE_KEY`.
4. `npm run dev` — dashboard at `http://localhost:3000/`. (`src/app/dashboard/page.tsx`
   is a dead stub, not the real route — don't be misled by the folder name.)

### Database

There's no migration tooling wired up yet — `supabase/migrations/` holds one
hand-written RLS migration
(`20261124000000_lock_down_rls.sql`) that you run manually via the Supabase
SQL editor. Read its comments before running it against a project that
already has data in `jobs`/`profiles`.

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build (also what CI runs) |
| `npm run lint` | ESLint |
| `npm test` | Vitest — unit tests under `src/**/*.test.ts` and `scripts/**/*.test.mjs` |
| `npx tsc --noEmit` | Typecheck only |

CI (`.github/workflows/ci.yml`) runs build + typecheck + test as blocking
checks on every PR and push to `master`, and lint as non-blocking (the repo
has a backlog of pre-existing lint errors, mostly `no-explicit-any`, that
predate CI being added).

## Project layout

- `src/app/` — Next.js App Router pages and API routes (`src/app/api/*`).
- `src/lib/` — shared app code: `supabase.ts` (browser/anon client),
  `supabase-admin.ts` (server-only, service-role client — **never** import
  this from a Client Component), `filters.ts` (the `isWorldwide` geo-filter
  "bouncer"), `alert.ts` (structured failure logging + email alerts for the
  unattended cron routes), `profile.ts` (fetches the app's one hardcoded
  resume row, used by every AI route), `applications.ts` (the Gemini calls
  behind resume-tailoring and application-email drafting), `pdf-helper.ts`
  (builds the tailored-resume PDF — `buildTailoredPdfDoc` for the shared
  layout, `generateTailoredPDF` for the client-side download,
  `buildTailoredPdfBuffer` for attaching it to an outbound email).
- `src/services/` — client-side data access (`jobService.ts`, used by the
  dashboard via React Query).
- `scripts/` — standalone Node scripts, each scraping one job source, run by
  a matching `.github/workflows/*.yml` on a cron schedule. `scripts/lib/`
  holds what's shared between them: `db.mjs` (dedupe-against-Supabase +
  insert), `notify.mjs` (the "new leads found" email), `alert.mjs` (failure
  logging + alert email + marks the GitHub Actions run as failed).
- `supabase/migrations/` — hand-written SQL, applied manually (see above).

## Adding or changing a scraper

Scrapers follow a `fetch source → normalize → filter → dedupe/insert →
notify` shape. If you're writing a new one, use `scripts/lib/db.mjs`
(`dedupeAndInsertJobs`, or `findNewJobs`/`insertJobs` separately if you need
to do per-job work — generating outreach copy, say — before deciding what to
insert) and `scripts/lib/notify.mjs` (`sendNewLeadsEmail`) rather than
hand-rolling the Supabase/Resend calls again. Wrap the script's top-level
`catch` with `scripts/lib/alert.mjs`'s `reportFailure(scriptName, err)` so a
broken scraper shows up as a failed GitHub Actions run and an email, instead
of silently going quiet.

A few scripts in `scripts/` are **not** on this shared pattern yet, on
purpose — they involve product decisions (which implementation to keep,
whether to merge two divergent data tracks) rather than a pure refactor:

- `job-pipeline.mjs` looks like a superseded duplicate of
  `job-pipeline-scale.mjs`.
- `vc-ingest.mjs` → `vc_companies` → `vc-job-harvester.mjs` and
  `vc-ingestmain.mjs` → `vc_portfolio_companies` → `vc-job-scout.mjs` are two
  parallel, never-intersecting VC-company-discovery pipelines.
- Most scripts dedupe new jobs by `url`; `job-pipeline*.mjs` instead key on
  an MD5 content-fingerprint.
- No script calls `src/lib/filters.ts`'s `isWorldwide`; several have their
  own independent (and differently worded) geo-filter, and a few have none.

If you touch one of these, flag the inconsistency rather than quietly
"fixing" it — changing any of the above changes what counts as a duplicate
or what passes the filter, which is a product call, not just cleanup.

## Sending real applications

`POST /api/applications/draft` and `POST /api/applications/send` (wired up
behind the "Apply" button on each job card, `src/components/ApplicationModal.tsx`)
draft and send a real, addressed application email with a tailored resume
PDF attached. A few things to know:

- `application_email` has to be set on the job first (manually, in the
  modal) — no scraper captures one; see the note in `.env.example`.
- Drafting is ungated (same tier as `/api/match`/`/api/cover-letter`), but
  **sending requires `ADMIN_PASSWORD`**, the same gate `/api/profile` uses —
  it's the one route in this app with a real, irreversible, external effect.
- Sending requires `APPLICATION_FROM_EMAIL` to be set to a Resend-verified
  domain. Every other outbound email in this app uses Resend's shared
  sandbox sender, which can only deliver to your own address — it cannot
  reach a third-party recruiter. The send route refuses clearly if this
  isn't configured, rather than failing silently or bouncing.
- There's deliberately no automated web-form-filling or auto-send path.
  ATS platforms (Greenhouse/Lever/Ashby) generally prohibit automated
  submissions and run bot-detection; don't add one.

## Secrets

Scraper secrets live as GitHub Actions repository secrets (referenced in
`.github/workflows/*.yml`); app secrets live in Vercel's project settings
for production and `.env.local` locally. Never commit `.env.local` or print
secret values in logs, PRs, or commit messages.
