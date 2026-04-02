// import { getSupabase } from "@/lib/supabase";

// export const jobService = {
//   async getJobs({ pageParam = 0 }) {
//     const client = getSupabase(); // Initialize right when we need it
//     const pageSize = 15;
//     const { data, error } = await client
//       .from("jobs")
//       .select("*")
//       .order("created_at", { ascending: false })
//       .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

//     if (error) throw error;
//     return data;
//   },

//   async updateJobStatus(jobId: string, newStatus: string) {
//     const client = getSupabase();
//     const { error } = await client
//       .from("jobs")
//       .update({ status: newStatus })
//       .eq("id", jobId);

//     if (error) throw error;
//     return { jobId, newStatus };
//   },
// };

import { getSupabase } from "@/lib/supabase";

export const jobService = {
  async getJobs({ pageParam = 0, statusFilter = "all" }) {
    const client = getSupabase();
    const pageSize = 15;

    // Start the query
    let query = client
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filter logic
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query.range(
      pageParam * pageSize,
      (pageParam + 1) * pageSize - 1,
    );

    if (error) throw error;
    return data;
  },

  async updateJobStatus(jobId: string, newStatus: string) {
    const client = getSupabase();
    const { error } = await client
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", jobId);

    if (error) throw error;
    return true;
  },
};
