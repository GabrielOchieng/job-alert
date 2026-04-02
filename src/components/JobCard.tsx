import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Building2, Calendar } from "lucide-react";

export default function JobCard({ job }: { job: any }) {
  const isDirect = /lever|greenhouse|workable/.test(job.url);

  return (
    <Card className="hover:border-blue-400 transition-all duration-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xl text-slate-900">
                {job.title || "Frontend Engineer"}
              </h3>
              {isDirect && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700"
                >
                  Direct Apply
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-slate-500 text-sm">
              <div className="flex items-center gap-1">
                <Building2 size={16} />
                <span>{job.company || "Company"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{new Date(job.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <Badge variant="outline" className="capitalize">
              {job.status}
            </Badge>
            <a
              href={job.url}
              target="_blank"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              View Job <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
