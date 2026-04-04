// // import { getSupabase } from "@/lib/supabase";
// // import { NextResponse } from "next/server";

// // export async function POST(req: Request) {
// //   try {
// //     const { resumeText } = await req.json();
// //     const supabase = getSupabase();

// //     const { error } = await supabase.from("profiles").upsert(
// //       {
// //         // Using a standard, valid v4 UUID
// //         id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
// //         resume_text: resumeText,
// //         updated_at: new Date().toISOString(),
// //       },
// //       {
// //         onConflict: "id", // Tells Supabase to overwrite if this ID exists
// //       },
// //     );

// //     if (error) {
// //       console.error("Supabase Error:", error.message); // This will show in your terminal
// //       return NextResponse.json({ error: error.message }, { status: 400 });
// //     }

// //     return NextResponse.json({ success: true });
// //   } catch (error: any) {
// //     console.error("Server Error:", error);
// //     return NextResponse.json(
// //       { error: "Internal Server Error" },
// //       { status: 500 },
// //     );
// //   }
// // }

// // src/app/api/profile/route.ts
// import { getSupabase } from "@/lib/supabase";
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const { resumeText, adminPassword } = await req.json();

//     // 1. SECURITY CHECK: Compare provided password with Vercel Environment Variable
//     // Ensure you have ADMIN_PASSWORD set in your Vercel/Local .env
//     if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
//       return NextResponse.json(
//         {
//           error:
//             "Unauthorized: Invalid admin password. Database write blocked.",
//         },
//         { status: 401 },
//       );
//     }

//     const supabase = getSupabase();

//     const { error } = await supabase.from("profiles").upsert(
//       {
//         id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", // Your fixed unique profile ID
//         resume_text: resumeText,
//         updated_at: new Date().toISOString(),
//       },
//       { onConflict: "id" },
//     );

//     if (error) {
//       console.error("Supabase Error:", error.message);
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     }

//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     console.error("Server Error:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 },
//     );
//   }
// }

// src/app/api/profile/route.ts
import { getSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { resumeText, adminPassword } = await req.json();

    // 1. SECURITY CHECK: Compare against the secret Server-Side Environment Variable
    // This variable is set in Vercel and is NEVER sent to the browser.
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || adminPassword !== correctPassword) {
      return NextResponse.json(
        {
          error: "Unauthorized Access",
          message: "Database writes are restricted to the portfolio owner.",
          code: "ADMIN_ONLY",
        },
        { status: 401 },
      );
    }

    const supabase = getSupabase();

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
