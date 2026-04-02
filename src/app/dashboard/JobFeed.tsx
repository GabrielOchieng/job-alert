// "use client";
// import { useInfiniteQuery } from "@tanstack/react-query";
// import { jobService } from "@/services/jobService";
// import JobCard from "@/components/JobCard";
// import { Loader2 } from "lucide-react";
// import { useInView } from "react-intersection-observer";
// import { useEffect } from "react";

// export default function JobFeed() {
//   const { ref, inView } = useInView();

//   const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
//     useInfiniteQuery({
//       queryKey: ["jobs"],
//       queryFn: ({ pageParam }) => jobService.getJobs({ pageParam }),
//       initialPageParam: 0,
//       getNextPageParam: (lastPage, allPages) => {
//         return lastPage.length > 0 ? allPages.length : undefined;
//       },
//     });

//   // Auto-fetch when scrolling to bottom
//   useEffect(() => {
//     if (inView && hasNextPage) fetchNextPage();
//   }, [inView, hasNextPage, fetchNextPage]);

//   if (status === "pending")
//     return (
//       <div className="flex justify-center p-20">
//         <Loader2 className="animate-spin" />
//       </div>
//     );

//   return (
//     <div className="space-y-6">
//       {data?.pages.map((page, i) => (
//         <div key={i} className="grid gap-6">
//           {page.map((job) => (
//             <JobCard key={job.id} job={job} />
//           ))}
//         </div>
//       ))}

//       {/* Loading Trigger Area */}
//       <div ref={ref} className="h-10 flex justify-center items-center">
//         {isFetchingNextPage ? (
//           <Loader2 className="animate-spin text-blue-500" />
//         ) : hasNextPage ? (
//           <p className="text-slate-400 text-sm">Load more...</p>
//         ) : (
//           <p className="text-slate-400 text-sm">You've reached the end! 🚀</p>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { jobService } from "@/services/jobService";
import JobCard from "@/components/JobCard";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

export default function JobFeed() {
  const { ref, inView } = useInView();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["jobs", statusFilter], // Refetch when filter changes
      queryFn: ({ pageParam }) =>
        jobService.getJobs({ pageParam, statusFilter }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length > 0 ? allPages.length : undefined;
      },
    });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse">
          Scanning the matrix...
        </p>
      </div>
    );
  }

  const allJobs = data?.pages.flatMap((page) => page) || [];

  if (allJobs.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border/50">
        <p className="text-muted-foreground">
          No jobs found matching this filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allJobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}

      <div ref={ref} className="h-20 flex justify-center items-center">
        {isFetchingNextPage && (
          <Loader2 className="animate-spin text-primary" />
        )}
      </div>
    </div>
  );
}
