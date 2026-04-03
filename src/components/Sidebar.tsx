"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Filter, Sparkles, Briefcase } from "lucide-react";

// 1. Define the props interface for the counts
interface SidebarProps {
  counts: {
    all: number;
    new: number;
    applied: number;
  };
}

export default function Sidebar({ counts }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "all";

  const handleFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // 2. Map the incoming counts to your options
  const statusOptions = [
    { id: "all", label: "All Leads", count: counts.all },
    { id: "new", label: "New Only", count: counts.new },
    { id: "applied", label: "Applied", count: counts.applied },
  ];

  return (
    <aside className="w-full lg:w-64 space-y-8 h-fit lg:sticky lg:top-24">
      <div>
        <div className="flex items-center gap-2 mb-4 text-primary font-bold">
          <Filter size={18} />
          <span>Filters</span>
        </div>
        <Separator className="mb-6 opacity-10" />

        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Sparkles size={14} /> Status
          </h4>
          <div className="grid gap-3">
            {statusOptions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between group cursor-pointer"
                onClick={() => handleFilterChange(item.id)}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={item.id}
                    checked={currentStatus === item.id}
                    className="border-primary/30 data-[state=checked]:bg-primary"
                  />
                  <Label
                    htmlFor={item.id}
                    className="text-sm font-medium leading-none cursor-pointer group-hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Label>
                </div>

                {/* 3. The Count Badge */}
                <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded border border-border/50 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-colors">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator className="opacity-10" />

      <div>
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
          <Briefcase size={14} /> Platform
        </h4>
        <div className="space-y-3 opacity-50 cursor-not-allowed">
          <p className="text-xs italic text-muted-foreground">
            Coming soon: Filter by ATS
          </p>
        </div>
      </div>
    </aside>
  );
}
