// // "use client";

// // import { Suspense } from "react";
// // import Navbar from "@/components/Navbar";
// // import Sidebar from "@/components/Sidebar";
// // import JobFeed from "@/app/dashboard/JobFeed";
// // import { useQuery } from "@tanstack/react-query";
// // import { jobService } from "@/services/jobService";

// // export default function HomePage() {
// //   const { data: rawStatuses } = useQuery({
// //     queryKey: ["job-counts"],
// //     queryFn: jobService.getAllJobStatuses,
// //   });

// //   const counts = {
// //     all: rawStatuses?.length || 0,
// //     new:
// //       rawStatuses?.filter((j) => !j.status || j.status === "new").length || 0,
// //     applied: rawStatuses?.filter((j) => j.status === "applied").length || 0,
// //   };
// //   return (
// //     <div className="min-h-screen bg-background transition-colors duration-300">
// //       <Navbar />

// //       <main className="max-w-7xl mx-auto px-6 py-10">
// //         {/* WRAP EVERYTHING THAT USES SEARCH PARAMS IN SUSPENSE
// //           This includes Sidebar (which reads params) and JobFeed (which reacts to them)
// //         */}
// //         <Suspense
// //           fallback={
// //             <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground animate-pulse">
// //               Loading Rocketship Dashboard...
// //             </div>
// //           }
// //         >
// //           <div className="flex flex-col lg:flex-row gap-0 lg:gap-10">
// //             {/* Sidebar Area */}
// //             <div className="lg:pr-10 lg:border-r-2 border-primary/20 pb-10 lg:pb-0">
// //               <Sidebar counts={counts} />
// //             </div>

// //             {/* Feed Area */}
// //             <div className="flex-1 lg:pl-4">
// //               <header className="mb-8">
// //                 <div className="flex items-center gap-3 mb-2">
// //                   <h1 className="text-3xl font-bold tracking-tight">
// //                     Active Opportunities
// //                   </h1>
// //                   <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
// //                     Live
// //                   </span>
// //                 </div>
// //                 <p className="text-muted-foreground">
// //                   Real-time frontend leads from the Remote Rocketship engine.
// //                 </p>
// //               </header>

// //               <JobFeed />
// //             </div>
// //           </div>
// //         </Suspense>
// //       </main>
// //     </div>
// //   );
// // }

// // src/app/page.tsx
// import { Suspense } from "react";
// import Navbar from "@/components/Navbar";
// import JobFeed from "@/app/dashboard/JobFeed";
// import SidebarWrapper from "@/components/SidebarWrapper";

// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar /> {/* This stays a high-performance Server Component */}
//       <main className="max-w-7xl mx-auto px-6 py-10">
//         <div className="flex flex-col lg:flex-row gap-0 lg:gap-10">
//           <div className="lg:pr-10 lg:border-r-2 border-primary/20 pb-10 lg:pb-0">
//             {/* Suspense handles the loading state of the client-side counts */}
//             <Suspense
//               fallback={
//                 <div className="w-64 h-48 animate-pulse bg-muted rounded-xl" />
//               }
//             >
//               <SidebarWrapper />
//             </Suspense>
//           </div>

//           <div className="flex-1 lg:pl-4">
//             <header className="mb-8">
//               <h1 className="text-3xl font-bold tracking-tight">
//                 Active Opportunities
//               </h1>
//             </header>

//             <Suspense fallback={<div>Loading Feed...</div>}>
//               <JobFeed />
//             </Suspense>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

// src/app/page.tsx
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import JobFeed from "@/app/dashboard/JobFeed";
import SidebarWrapper from "@/components/SidebarWrapper";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* FIX: Navbar uses useSearchParams() for the search bar, 
          so it MUST be wrapped in Suspense for the build to pass. 
      */}
      <Suspense
        fallback={
          <div className="h-16 border-b bg-background/95 animate-pulse" />
        }
      >
        <Navbar />
      </Suspense>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-10">
          <div className="lg:pr-10 lg:border-r-2 border-primary/20 pb-10 lg:pb-0">
            <Suspense
              fallback={
                <div className="w-64 h-48 animate-pulse bg-muted rounded-xl" />
              }
            >
              <SidebarWrapper />
            </Suspense>
          </div>

          <div className="flex-1 lg:pl-4">
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Active Opportunities
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Real-time AI-tailored leads for Gabriel.
              </p>
            </header>

            <Suspense
              fallback={
                <div className="flex flex-col gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-40 w-full bg-muted animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              }
            >
              <JobFeed />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
