import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isValidAdminPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { resumeText, adminPassword } = await req.json();

    // 1. SECURITY CHECK: Compare against the secret Server-Side Environment Variable
    // This variable is set in Vercel and is NEVER sent to the browser.
    // Uses a constant-time comparison so response timing can't leak the password.
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (
      !adminPassword ||
      !correctPassword ||
      !isValidAdminPassword(adminPassword, correctPassword)
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized Access",
          message: "Database writes are restricted to the portfolio owner.",
          code: "ADMIN_ONLY",
        },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdmin();

    // 2. AUTHORIZED: Perform the Upsert
    const { error } = await supabase.from("profiles").upsert(
      {
        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", // Your fixed profile ID
        resume_text: resumeText,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("Supabase Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
