-- Lock down Row Level Security for the job-alert-app data layer.
--
-- Context: the browser dashboard talks to Supabase directly with the
-- NEXT_PUBLIC_SUPABASE_KEY (anon key), which is public by design — anyone
-- who has it (it ships in the JS bundle) can call the Supabase REST API
-- with it directly, bypassing this app's own API routes entirely.
-- These policies make sure that key can only do what the dashboard
-- actually needs, and nothing else.
--
-- Run this once via the Supabase SQL editor, or `supabase db push` if you
-- adopt the Supabase CLI. Review it against your actual schema first —
-- column/table names are assumed from the application code
-- (src/services/jobService.ts, src/lib/supabase-admin.ts).

-- 1. Turn on RLS. With RLS enabled and no matching policy, a table is
--    closed by default — including to the anon key.
alter table public.jobs enable row level security;
alter table public.profiles enable row level security;

-- 2. `jobs`: the dashboard (anon key, client-side) needs to read all jobs,
--    update a job's status, and delete a job. It never needs to insert —
--    only the server-side scrapers (service role key) insert new jobs.
drop policy if exists "anon can read jobs" on public.jobs;
create policy "anon can read jobs"
  on public.jobs for select
  to anon
  using (true);

drop policy if exists "anon can update job status" on public.jobs;
create policy "anon can update job status"
  on public.jobs for update
  to anon
  using (true)
  with check (true);
-- If you want to be stricter and only allow the `status` column to change,
-- enforce that in a trigger (RLS policies can't target individual columns).

drop policy if exists "anon can delete jobs" on public.jobs;
create policy "anon can delete jobs"
  on public.jobs for delete
  to anon
  using (true);

-- No insert policy for anon — inserts only happen server-side via the
-- service role key (src/lib/supabase-admin.ts), which bypasses RLS.

-- 3. `profiles`: contains resume text. The anon key should have NO access —
--    all reads/writes go through server API routes using the service role
--    key (src/lib/supabase-admin.ts), gated by ADMIN_PASSWORD.
--    Simply enabling RLS with zero policies for `anon`/`authenticated`
--    already blocks all access from those roles; no policy is created here
--    on purpose.
