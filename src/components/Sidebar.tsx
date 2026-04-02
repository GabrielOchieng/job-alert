// "use client";

// import { Checkbox } from "@/components/ui/checkbox";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { Briefcase, Filter, Sparkles, MapPin } from "lucide-react";

// export default function Sidebar() {
//   return (
//     <aside className="w-full lg:w-64 space-y-8 h-fit lg:sticky lg:top-24">
//       <div>
//         <div className="flex items-center gap-2 mb-4 text-primary font-bold">
//           <Filter size={18} />
//           <span>Filters</span>
//         </div>
//         <Separator className="mb-6 opacity-20" />

//         {/* Status Filter */}
//         <div className="space-y-4">
//           <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/70">
//             <Sparkles size={14} /> Status
//           </h4>
//           {["New Leads", "Applied", "Interviewing"].map((status) => (
//             <div key={status} className="flex items-center space-x-2">
//               <Checkbox
//                 id={status}
//                 className="border-primary/50 data-[state=checked]:bg-primary"
//               />
//               <Label
//                 htmlFor={status}
//                 className="text-sm font-medium leading-none cursor-pointer hover:text-primary transition-colors"
//               >
//                 {status}
//               </Label>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div>
//         <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground/70">
//           <Briefcase size={14} /> Platform
//         </h4>
//         <div className="space-y-4">
//           {["Lever", "Greenhouse", "Workable"].map((ats) => (
//             <div key={ats} className="flex items-center space-x-2">
//               <Checkbox id={ats} className="border-primary/50" />
//               <Label htmlFor={ats} className="text-sm">
//                 {ats}
//               </Label>
//             </div>
//           ))}
//         </div>
//       </div>
//     </aside>
//   );
// }

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Filter, Sparkles, Briefcase } from "lucide-react";

export default function Sidebar() {
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

  const statusOptions = [
    { id: "all", label: "All Leads" },
    { id: "new", label: "New Only" },
    { id: "applied", label: "Applied" },
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
                className="flex items-center space-x-3 group cursor-pointer"
                onClick={() => handleFilterChange(item.id)}
              >
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
