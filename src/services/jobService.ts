// import { supabase } from "@/lib/supabase";

// export const jobService = {
//   async getJobs({ pageParam = 0 }) {
//     const pageSize = 15;
//     const { data, error } = await supabase
//       .from("jobs")
//       .select("*")
//       .order("created_at", { ascending: false })
//       .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

//     if (error) throw error;
//     return data;
//   },

//   async updateStatus(jobId: string, status: string) {
//     const { error } = await supabase
//       .from("jobs")
//       .update({ status })
//       .eq("id", jobId);

//     if (error) throw error;
//   },
// };

import { getSupabase } from "@/lib/supabase";

export const jobService = {
  async getJobs({ pageParam = 0 }) {
    const client = getSupabase(); // Initialize right when we need it
    const pageSize = 15;
    const { data, error } = await client
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

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
    return { jobId, newStatus };
  },
};
