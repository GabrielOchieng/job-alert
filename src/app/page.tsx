// import { Suspense } from "react";
// import Navbar from "@/components/Navbar";
// import Sidebar from "@/components/Sidebar";
// import JobFeed from "@/app/dashboard/JobFeed";

// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-background transition-colors duration-300">
//       {/* Separated Navbar */}
//       <Navbar />

//       {/* Main Layout Container */}
//       <main className="max-w-7xl mx-auto px-6 py-10">
//         <div className="flex flex-col lg:flex-row gap-0 lg:gap-10">
//           {/* Sidebar Area with Vertical Line */}
//           <div className="lg:pr-10 lg:border-r-2 border-primary/20 pb-10 lg:pb-0">
//             <Sidebar />
//           </div>

//           {/* Feed Area */}
//           <div className="flex-1 lg:pl-4">
//             <header className="mb-8">
//               <h1 className="text-3xl font-bold tracking-tight">
//                 Active Opportunities
//               </h1>
//               <p className="text-muted-foreground mt-1">
//                 Real-time frontend leads from the Remote Rocketship engine.
//               </p>
//             </header>

//             <Suspense
//               fallback={
//                 <div className="p-20 text-center text-muted-foreground animate-pulse">
//                   Initializing Feed...
//                 </div>
//               }
//             >
//               <JobFeed />
//             </Suspense>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import JobFeed from "@/app/dashboard/JobFeed";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* WRAP EVERYTHING THAT USES SEARCH PARAMS IN SUSPENSE 
          This includes Sidebar (which reads params) and JobFeed (which reacts to them)
        */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground animate-pulse">
              Loading Rocketship Dashboard...
            </div>
          }
        >
          <div className="flex flex-col lg:flex-row gap-0 lg:gap-10">
            {/* Sidebar Area */}
            <div className="lg:pr-10 lg:border-r-2 border-primary/20 pb-10 lg:pb-0">
              <Sidebar />
            </div>

            {/* Feed Area */}
            <div className="flex-1 lg:pl-4">
              <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold tracking-tight">
                    Active Opportunities
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    Live
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Real-time frontend leads from the Remote Rocketship engine.
                </p>
              </header>

              <JobFeed />
            </div>
          </div>
        </Suspense>
      </main>
    </div>
  );
}
