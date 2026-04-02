import { supabase } from "@/lib/supabase";

export default async function Dashboard() {
  // Fetch the latest 50 jobs from your DB
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">🎯 My Job Feed</h1>

      <div className="grid gap-4">
        {jobs?.map((job) => (
          <div
            key={job.id}
            className="p-4 border rounded-lg hover:shadow-md transition bg-white flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold text-lg">{job.url.split("/")[2]}</h2>
              <p className="text-sm text-gray-500 truncate max-w-md">
                {job.url}
              </p>
            </div>
            <a
              href={job.url}
              target="_blank"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium"
            >
              Apply Now
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
