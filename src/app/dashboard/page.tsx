import { supabase } from "@/lib/supabase";
import JobCard from "@/components/JobCard";
import { Input } from "@/components/ui/input";

export default async function Dashboard() {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Command Center
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Managing {jobs?.length} latest opportunities.
            </p>
          </div>
          <div className="w-72">
            <Input placeholder="Search companies..." className="bg-white" />
          </div>
        </header>

        <div className="grid gap-6">
          {jobs?.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}
