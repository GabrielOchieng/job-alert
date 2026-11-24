-- Adds the columns the "apply by email" feature needs on `jobs`.
--
-- application_email   — manually entered per job (no scraper populates
--                        this; jobs only ever capture a `url` to the ATS
--                        posting, never a recruiter/application email).
-- application_draft   — jsonb { email: {subject, body}, resume: {...},
--                        generatedAt }, written once by POST
--                        /api/applications/draft so the send step attaches
--                        exactly what the user reviewed.
-- application_sent_at — set by POST /api/applications/send on success;
--                        `status` is set to "applied" at the same time,
--                        reusing the existing SECURED badge logic.
--
-- Run this once via the Supabase SQL editor (same as
-- 20261124000000_lock_down_rls.sql — not applied automatically).

alter table public.jobs
  add column if not exists application_email text,
  add column if not exists application_draft jsonb,
  add column if not exists application_sent_at timestamptz;
