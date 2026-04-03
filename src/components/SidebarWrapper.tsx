"use client";

import { useQuery } from "@tanstack/react-query";
import { jobService } from "@/services/jobService";
import { useSearchParams } from "next/navigation";
import Sidebar from "./Sidebar";

export default function SidebarWrapper() {
  const searchParams = useSearchParams();
  // Ensure we get a string, never undefined
  const searchQuery = searchParams.get("q") || "";

  const { data: rawStatuses, isLoading } = useQuery({
    // Adding searchQuery to the key is CRITICAL to trigger a refetch
    queryKey: ["job-counts", searchQuery],
    queryFn: () => jobService.getAllJobStatuses(searchQuery),
    // Don't run the query if we don't have a stable searchParams object yet
    enabled: true,
  });

  // Show a loading state so it doesn't just flash "0"
  if (isLoading)
    return <div className="w-64 h-32 animate-pulse bg-muted rounded-xl" />;

  const counts = {
    all: rawStatuses?.length || 0,
    new:
      rawStatuses?.filter((j: any) => !j.status || j.status === "new").length ||
      0,
    applied:
      rawStatuses?.filter((j: any) => j.status === "applied").length || 0,
  };

  return <Sidebar counts={counts} />;
}
