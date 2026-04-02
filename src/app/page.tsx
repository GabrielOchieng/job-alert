import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import JobFeed from "@/app/dashboard/JobFeed";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Separated Navbar */}
      <Navbar />

      {/* Main Layout Container */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-10">
          {/* Sidebar Area with Vertical Line */}
          <div className="lg:pr-10 lg:border-r-2 border-primary/20 pb-10 lg:pb-0">
            <Sidebar />
          </div>

          {/* Feed Area */}
          <div className="flex-1 lg:pl-4">
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Active Opportunities
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time frontend leads from the Remote Rocketship engine.
              </p>
            </header>

            <Suspense
              fallback={
                <div className="p-20 text-center text-muted-foreground animate-pulse">
                  Initializing Feed...
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
