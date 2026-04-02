"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobService } from "@/services/jobService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  url: string;
  status: string;
  created_at: string;
}

export default function JobCard({ job }: { job: Job }) {
  const queryClient = useQueryClient();
  const isDirect = /lever|greenhouse|workable|ashby/.test(
    job.url.toLowerCase(),
  );

  const mutation = useMutation({
    mutationFn: (newStatus: string) =>
      jobService.updateJobStatus(job.id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const isApplied = job.status === "applied";

  return (
    <Card
      className={`transition-all duration-200 shadow-sm border-l-4 overflow-hidden ${
        isApplied
          ? "border-l-emerald-500 bg-muted/30"
          : "border-l-transparent hover:border-primary/50 bg-card"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Left Side: Job Info */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`font-bold text-xl tracking-tight ${
                  isApplied ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {job.title || "Frontend Engineer"}
              </h3>
              {isDirect && (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-secondary/50 text-foreground/80 border-none px-3 py-1"
                >
                  Direct Apply
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
              <div className="flex items-center gap-1.5">
                <Building2 size={16} />
                <span className="font-medium text-foreground/80">
                  {job.company || "Company"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={16} />
                <span>
                  {new Date(job.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
            <Badge
              variant={isApplied ? "default" : "outline"}
              className={`capitalize px-3 ${isApplied ? "bg-emerald-600 text-white" : "text-muted-foreground"}`}
            >
              {isApplied ? "Applied" : job.status}
            </Badge>

            <div className="flex items-center gap-2">
              {!isApplied ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 transition-colors hover:bg-emerald-500/10 hover:text-emerald-500"
                  onClick={() => mutation.mutate("applied")}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Mark Applied"
                  )}
                </Button>
              ) : (
                <div className="flex items-center text-emerald-500 px-3 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                  <CheckCircle2 size={18} className="mr-1.5" />
                  <span className="text-sm font-semibold">Saved</span>
                </div>
              )}

              <Button asChild size="sm" className="h-9 px-4">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  View <ExternalLink size={14} />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
