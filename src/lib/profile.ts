import { getSupabaseAdmin } from "@/lib/supabase-admin";

// The app is single-profile today — every route that needs the resume
// reads this one fixed row.
const PROFILE_ID = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";

export class ResumeMissingError extends Error {
  constructor() {
    super("Resume missing");
    this.name = "ResumeMissingError";
  }
}

/** Fetches the resume text for the app's one profile. Throws ResumeMissingError if unset. */
export async function getResumeText(): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_text")
    .eq("id", PROFILE_ID)
    .single();

  if (!profile?.resume_text) {
    throw new ResumeMissingError();
  }

  return profile.resume_text;
}
