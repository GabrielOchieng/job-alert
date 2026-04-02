import { ModeToggle } from "@/components/ModeToggle";
import JobFeed from "./JobFeed";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-5xl mx-auto p-6 md:p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              Command Center
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Automated Job Intelligence
            </p>
          </div>
          <ModeToggle />
        </header>

        <JobFeed />
      </div>
    </div>
  );
}
