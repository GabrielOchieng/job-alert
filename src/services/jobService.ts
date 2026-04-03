// src/services/jobService.ts
import { getSupabase } from "@/lib/supabase";

export const jobService = {
  async getJobs({ pageParam = 0, statusFilter = "all", searchQuery = "" }) {
    const client = getSupabase();
    const pageSize = 15;

    let query = client
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    // 1. Status Logic
    if (statusFilter !== "all") {
      if (statusFilter === "new") {
        query = query.or("status.is.null,status.eq.new");
      } else {
        query = query.eq("status", statusFilter);
      }
    }

    // 2. Search Logic - Strict Syntax (No spaces after commas)
    const search = searchQuery?.trim() || "";
    if (search !== "") {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data, error } = await query.range(
      pageParam * pageSize,
      (pageParam + 1) * pageSize - 1,
    );

    if (error) {
      console.error("Supabase Query Error:", error.message);
      throw error;
    }
    return data || [];
  },

  async getAllJobStatuses(searchQuery = "") {
    const client = getSupabase();
    let query = client.from("jobs").select("status");

    const search = searchQuery?.trim() || "";
    if (search !== "") {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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
