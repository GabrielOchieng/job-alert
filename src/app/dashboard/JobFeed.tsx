// // "use client";

// // import { useSearchParams } from "next/navigation";
// // import { useInfiniteQuery } from "@tanstack/react-query";
// // import { jobService } from "@/services/jobService";

// // import { Loader2 } from "lucide-react";
// // import { useInView } from "react-intersection-observer";
// // import { useEffect } from "react";
// // import JobCard from "@/components/JobCard";

// // export default function JobFeed() {
// //   const { ref, inView } = useInView();
// //   const searchParams = useSearchParams();
// //   const statusFilter = searchParams.get("status") || "all";
// //   const searchQuery = searchParams.get("q") || "";

// //   const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
// //     useInfiniteQuery({
// //       queryKey: ["jobs", statusFilter, searchQuery], // Add searchQuery to key
// //       queryFn: ({ pageParam }) =>
// //         jobService.getJobs({ pageParam, statusFilter, searchQuery }), // Pass it to service
// //       initialPageParam: 0,
// //       getNextPageParam: (lastPage, allPages) => {
// //         return lastPage.length > 0 ? allPages.length : undefined;
// //       },
// //     });

// //   console.log("Current Search:", searchQuery);
// //   console.log("Raw Data from Query:", data);

// //   useEffect(() => {
// //     if (inView && hasNextPage) fetchNextPage();
// //   }, [inView, hasNextPage, fetchNextPage]);

// //   if (status === "pending") {
// //     return (
// //       <div className="flex flex-col items-center justify-center p-20 gap-4">
// //         <Loader2 className="animate-spin text-primary" size={40} />
// //         <p className="text-muted-foreground animate-pulse">
// //           Scanning the matrix...
// //         </p>
// //       </div>
// //     );
// //   }

// //   const allJobs = data?.pages.flatMap((page) => page) || [];

// //   console.log("Flattened Jobs Count:", allJobs.length);

// //   if (allJobs.length === 0) {
// //     return (
// //       <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border/50">
// //         <p className="text-muted-foreground">
// //           No jobs found matching this filter.
// //         </p>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="space-y-6">
// //       {allJobs.map((job) => (
// //         <JobCard key={job.id} job={job} />
// //       ))}

// //       <div ref={ref} className="h-20 flex justify-center items-center">
// //         {isFetchingNextPage && (
// //           <Loader2 className="animate-spin text-primary" />
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // src/app/dashboard/JobFeed.tsx
// "use client";

// import { useSearchParams } from "next/navigation";
// import { useInfiniteQuery } from "@tanstack/react-query";
// import { jobService } from "@/services/jobService";
// import { Loader2 } from "lucide-react";
// import { useInView } from "react-intersection-observer";
// import { useEffect } from "react";
// import JobCard from "@/components/JobCard";

// export default function JobFeed() {
//   const { ref, inView } = useInView();
//   const searchParams = useSearchParams();

//   // Extract URL params
//   const statusFilter = searchParams.get("status") || "all";
//   const searchQuery = searchParams.get("q") || "";

//   const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
//     useInfiniteQuery({
//       queryKey: ["jobs", statusFilter, searchQuery],
//       queryFn: ({ pageParam }) =>
//         jobService.getJobs({ pageParam, statusFilter, searchQuery }),
//       initialPageParam: 0,
//       getNextPageParam: (lastPage, allPages) => {
//         return lastPage.length > 0 ? allPages.length : undefined;
//       },
//     });

//   // Handle Infinite Scroll
//   useEffect(() => {
//     if (inView && hasNextPage) fetchNextPage();
//   }, [inView, hasNextPage, fetchNextPage]);

//   // 1. Initial Loading State
//   if (status === "pending") {
//     return (
//       <div className="flex flex-col items-center justify-center p-20 gap-4">
//         <Loader2 className="animate-spin text-primary" size={40} />
//         <p className="text-muted-foreground animate-pulse">
//           Scanning the matrix for {searchQuery ? `"${searchQuery}"` : "leads"}
//           ...
//         </p>
//       </div>
//     );
//   }

//   // 2. Flatten Data
//   const allJobs = data?.pages.flatMap((page) => page) || [];

//   // 3. True Empty State (Only after success)
//   if (status === "success" && allJobs.length === 0) {
//     return (
//       <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border/50 bg-muted/10">
//         <p className="text-muted-foreground">
//           No jobs found matching your criteria.
//         </p>
//         {searchQuery && (
//           <p className="text-xs text-primary mt-2">
//             Try a broader search term.
//           </p>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {allJobs.map((job) => (
//         <JobCard key={job.id} job={job} />
//       ))}

//       {/* Infinite Scroll Trigger */}
//       <div ref={ref} className="h-20 flex justify-center items-center">
//         {isFetchingNextPage && (
//           <div className="flex items-center gap-2 text-muted-foreground text-sm">
//             <Loader2 className="animate-spin" size={16} />
//             Loading more opportunities...
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { jobService } from "@/services/jobService";
import { Loader2, Inbox } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo } from "react";
import JobCard from "@/components/JobCard";

export default function JobFeed() {
  const { ref, inView } = useInView();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("q") || "";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      // searchQuery in the key ensures a fresh fetch when you type
      queryKey: ["jobs", statusFilter, searchQuery],
      queryFn: ({ pageParam }) =>
        jobService.getJobs({ pageParam, statusFilter, searchQuery }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        // If the last page had items, try to fetch the next index
        return lastPage && lastPage.length > 0 ? allPages.length : undefined;
      },
      // Keeps the UI stable while fetching new search results
      placeholderData: (prev) => prev,
    });

  // 1. DE-DUPLICATION LOGIC
  // We use useMemo to avoid re-calculating this on every minor re-render
  const allJobs = useMemo(() => {
    if (!data) return [];

    const flatJobs = data.pages.flatMap((page) => page);

    // Create a Map using Job ID as the key to automatically overwrite duplicates
    const uniqueJobsMap = new Map();
    flatJobs.forEach((job) => {
      if (job && job.id) {
        uniqueJobsMap.set(job.id, job);
      }
    });

    return Array.from(uniqueJobsMap.values());
  }, [data]);

  // Handle Infinite Scroll trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 2. INITIAL LOADING STATE
  if (status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 border-2 border-dashed rounded-3xl border-primary/10">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse text-sm font-medium">
          Syncing with the grid...
        </p>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (status === "success" && allJobs.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border/50 bg-muted/5">
        <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
          <Inbox size={24} />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          No matches found
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
          We couldn't find any {statusFilter !== "all" ? statusFilter : ""}{" "}
          leads matching "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4. RENDER UNIQUE JOBS */}
      <div className="grid gap-6">
        {allJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* 5. INFINITE SCROLL TARGET */}
      <div
        ref={ref}
        className="h-24 flex flex-col justify-center items-center gap-3"
      >
        {isFetchingNextPage ? (
          <>
            <Loader2 className="animate-spin text-primary/50" size={20} />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              Loading More
            </span>
          </>
        ) : hasNextPage ? (
          <div className="h-1 w-12 bg-primary/10 rounded-full" />
        ) : (
          <p className="text-xs text-muted-foreground italic">
            You've reached the end of the rocket's reach.
          </p>
        )}
      </div>
    </div>
  );
}
