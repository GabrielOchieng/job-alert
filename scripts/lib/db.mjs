// scripts/lib/db.mjs
//
// Shared Supabase access for the scraper scripts. Every scraper was doing
// its own `createClient(...)` plus a hand-rolled "check if this url exists,
// insert if not" loop (one query per job). This module gives them a single
// client and a single bulk dedupe-and-insert helper instead.
import { createClient } from "@supabase/supabase-js";
import { logError } from "./alert.mjs";

let client = null;

/**
 * Singleton Supabase client for scripts. Accepts either SUPABASE_KEY or
 * SUPABASE_SERVICE_ROLE_KEY (scripts/ use both names depending on which
 * workflow secret they were written against).
 */
export function getSupabaseClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) must be set.",
    );
  }

  client = createClient(url, key);
  return client;
}

function dedupeWithinBatch(jobs, keyField) {
  // An AI-extraction or scrape pass can occasionally return the same url
  // twice in one run, which would otherwise violate a unique constraint
  // on insert.
  const seen = new Map();
  for (const job of jobs) {
    const key = job?.[keyField];
    if (!key) continue;
    seen.set(key, job);
  }
  return [...seen.values()];
}

/**
 * Returns the subset of `jobs` whose `keyField` isn't already present in
 * `table` — a lookup only, nothing is inserted. Useful when a script needs
 * to do more per-job work (e.g. generating outreach copy) before deciding
 * what to insert.
 */
export async function findNewJobs(
  jobs,
  { table = "jobs", keyField = "url", client: providedClient } = {},
) {
  const db = providedClient || getSupabaseClient();
  const candidates = dedupeWithinBatch(jobs, keyField);
  if (candidates.length === 0) return [];

  const { data: existing, error: selectError } = await db
    .from(table)
    .select(keyField)
    .in(
      keyField,
      candidates.map((j) => j[keyField]),
    );

  if (selectError) {
    logError("findNewJobs", selectError, { table });
    return [];
  }

  const existingKeys = new Set((existing || []).map((row) => row[keyField]));
  return candidates.filter((j) => !existingKeys.has(j[keyField]));
}

/** Bulk-inserts `jobs` into `table`. Returns true on success. */
export async function insertJobs(
  jobs,
  { table = "jobs", client: providedClient } = {},
) {
  if (!jobs || jobs.length === 0) return true;
  const db = providedClient || getSupabaseClient();

  const { error } = await db.from(table).insert(jobs);
  if (error) {
    logError("insertJobs", error, { table, count: jobs.length });
    return false;
  }
  return true;
}

/**
 * Filters `jobs` down to the ones whose `keyField` isn't already in
 * `table`, then bulk-inserts them. Mirrors src/lib/supabase-admin.ts's
 * filterNewJobs so the app and the scripts dedupe the same way.
 *
 * Returns the list of jobs that were actually new (and attempted to insert),
 * regardless of whether the insert itself fully succeeded — same contract
 * the scripts' previous inline loops had.
 */
export async function dedupeAndInsertJobs(jobs, opts = {}) {
  const newJobs = await findNewJobs(jobs, opts);
  if (newJobs.length === 0) return [];
  await insertJobs(newJobs, opts);
  return newJobs;
}
