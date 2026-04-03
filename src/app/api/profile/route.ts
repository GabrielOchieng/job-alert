// import { getSupabase } from "@/lib/supabase";
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const { resumeText } = await req.json();
//     const supabase = getSupabase();

//     // Upsert: Updates if exists, inserts if not.
//     // We use a hardcoded ID 'user_1' for now since we aren't using Auth yet.
//     const { error } = await supabase.from("profiles").upsert({
//       id: "00000000-0000-0000-0000-000000000000", // Use a consistent UUID
//       resume_text: resumeText,
//       updated_at: new Date().toISOString(),
//     });

//     if (error) throw error;
//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to save profile" },
//       { status: 500 },
//     );
//   }
// }

import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();
    const supabase = getSupabase();

    const { error } = await supabase.from("profiles").upsert(
      {
        // Using a standard, valid v4 UUID
        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        resume_text: resumeText,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id", // Tells Supabase to overwrite if this ID exists
      },
    );

    if (error) {
      console.error("Supabase Error:", error.message); // This will show in your terminal
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
