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
