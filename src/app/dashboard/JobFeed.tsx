// "use client";

// import { useSearchParams } from "next/navigation";
// import { useInfiniteQuery } from "@tanstack/react-query";
// import { jobService } from "@/services/jobService";
// import { Loader2, Inbox } from "lucide-react";
// import { useInView } from "react-intersection-observer";
// import { useEffect, useMemo } from "react";
// import JobCard from "@/components/JobCard";

// export default function JobFeed() {
//   const { ref, inView } = useInView();
//   const searchParams = useSearchParams();

//   const statusFilter = searchParams.get("status") || "all";
//   const searchQuery = searchParams.get("q") || "";

//   const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
//     useInfiniteQuery({
//       // searchQuery in the key ensures a fresh fetch when you type
//       queryKey: ["jobs", statusFilter, searchQuery],
//       queryFn: ({ pageParam }) =>
//         jobService.getJobs({ pageParam, statusFilter, searchQuery }),
//       initialPageParam: 0,
//       getNextPageParam: (lastPage, allPages) => {
//         // If the last page had items, try to fetch the next index
//         return lastPage && lastPage.length > 0 ? allPages.length : undefined;
//       },
//       // Keeps the UI stable while fetching new search results
//       placeholderData: (prev) => prev,
//     });

//   // 1. DE-DUPLICATION LOGIC
//   // We use useMemo to avoid re-calculating this on every minor re-render
//   const allJobs = useMemo(() => {
//     if (!data) return [];

//     const flatJobs = data.pages.flatMap((page) => page);

//     // Create a Map using Job ID as the key to automatically overwrite duplicates
//     const uniqueJobsMap = new Map();
//     flatJobs.forEach((job) => {
//       if (job && job.id) {
//         uniqueJobsMap.set(job.id, job);
//       }
//     });

//     return Array.from(uniqueJobsMap.values());
//   }, [data]);

//   // Handle Infinite Scroll trigger
//   useEffect(() => {
//     if (inView && hasNextPage && !isFetchingNextPage) {
//       fetchNextPage();
//     }
//   }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

//   // 2. INITIAL LOADING STATE
//   if (status === "pending") {
//     return (
//       <div className="flex flex-col items-center justify-center p-20 gap-4 border-2 border-dashed rounded-3xl border-primary/10">
//         <Loader2 className="animate-spin text-primary" size={40} />
//         <p className="text-muted-foreground animate-pulse text-sm font-medium">
//           Syncing with the grid...
//         </p>
//       </div>
//     );
//   }

//   // 3. EMPTY STATE
//   if (status === "success" && allJobs.length === 0) {
//     return (
//       <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border/50 bg-muted/5">
//         <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
//           <Inbox size={24} />
//         </div>
//         <h3 className="text-lg font-semibold text-foreground">
//           No matches found
//         </h3>
//         <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
//           We couldn't find any {statusFilter !== "all" ? statusFilter : ""}{" "}
//           leads matching "{searchQuery}"
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* 4. RENDER UNIQUE JOBS */}
//       <div className="grid gap-6">
//         {allJobs.map((job) => (
//           <JobCard key={job.id} job={job} />
//         ))}
//       </div>

//       {/* 5. INFINITE SCROLL TARGET */}
//       <div
//         ref={ref}
//         className="h-24 flex flex-col justify-center items-center gap-3"
//       >
//         {isFetchingNextPage ? (
//           <>
//             <Loader2 className="animate-spin text-primary/50" size={20} />
//             <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
//               Loading More
//             </span>
//           </>
//         ) : hasNextPage ? (
//           <div className="h-1 w-12 bg-primary/10 rounded-full" />
//         ) : (
//           <p className="text-xs text-muted-foreground italic">
//             You've reached the end of the rocket's reach.
//           </p>
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
import { toast } from "sonner"; // 1. Import toast

export default function JobFeed() {
  const { ref, inView } = useInView();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("q") || "";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error, // 2. Grab error from query
  } = useInfiniteQuery({
    queryKey: ["jobs", statusFilter, searchQuery],
    queryFn: ({ pageParam }) =>
      jobService.getJobs({ pageParam, statusFilter, searchQuery }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage && lastPage.length > 0 ? allPages.length : undefined;
    },
    placeholderData: (prev) => prev,
  });

  // 3. ALERT: Handle errors automatically
  useEffect(() => {
    if (status === "error") {
      toast.error("Failed to sync with the grid", {
        description: "Check your connection and try refreshing.",
      });
    }
  }, [status]);

  // 4. DE-DUPLICATION LOGIC
  const allJobs = useMemo(() => {
    if (!data) return [];
    const flatJobs = data.pages.flatMap((page) => page);
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

  // INITIAL LOADING STATE
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

  // EMPTY STATE
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
      <div className="grid gap-6">
        {allJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* INFINITE SCROLL TARGET */}
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
          <p className="text-xs text-muted-foreground italic font-mono">
            [SYSTEM]: All signals decoded. End of transmission.
          </p>
        )}
      </div>
    </div>
  );
}
