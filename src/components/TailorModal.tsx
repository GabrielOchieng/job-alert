// "use client";

// import { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Loader2, CheckCircle2, AlertCircle, Copy } from "lucide-react";
// import { toast } from "sonner";

// export function TailorModal({ job, isOpen, onOpenChange }: any) {
//   const [data, setData] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(false);

//   const generateTailoredResume = async () => {
//     setIsLoading(true);
//     try {
//       const res = await fetch("/api/tailor-resume", {
//         method: "POST",
//         body: JSON.stringify({
//           jobTitle: job.title,
//           company: job.company,
//           jobDescription: job.description || job.title,
//         }),
//       });
//       const result = await res.json();
//       setData(result);
//     } catch (err) {
//       toast.error("Could not optimize resume.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-200 max-h-[85vh] overflow-y-auto bg-card">
//         <DialogHeader>
//           <DialogTitle className="text-xl font-bold">
//             Resume Optimizer for {job.company}
//           </DialogTitle>
//           <DialogDescription>
//             Gemini has analyzed the job description to find specific gaps in
//             your current profile.
//           </DialogDescription>
//         </DialogHeader>

//         {!data && !isLoading && (
//           <div className="py-10 text-center">
//             <Button onClick={generateTailoredResume}>
//               ✨ Analyze & Optimize Resume
//             </Button>
//           </div>
//         )}

//         {isLoading && (
//           <div className="py-20 flex flex-col items-center gap-4">
//             <Loader2 className="animate-spin text-primary" size={40} />
//             <p className="text-muted-foreground animate-pulse">
//               Scanning for ATS keywords...
//             </p>
//           </div>
//         )}

//         {data && (
//           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
//             {/* Keywords Section */}
//             <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
//               <h4 className="flex items-center gap-2 font-semibold text-amber-600 mb-2 text-sm">
//                 <AlertCircle size={16} /> MISSING KEYWORDS (Add these!)
//               </h4>
//               <div className="flex flex-wrap gap-2">
//                 {data?.keyKeywordsMissing?.map((word: string) => (
//                   <span
//                     key={word}
//                     className="bg-background px-2 py-1 rounded border text-[10px] font-mono"
//                   >
//                     {word}
//                   </span>
//                 ))}
//               </div>
//             </div>

//             {/* Optimized Summary */}
//             <div className="space-y-2">
//               <h4 className="font-bold text-sm flex justify-between">
//                 TAILORED SUMMARY
//                 <Button
//                   variant="ghost"
//                   size="xs"
//                   onClick={() => {
//                     navigator.clipboard.writeText(data.optimizedSummary);
//                     toast.success("Copied!");
//                   }}
//                 >
//                   <Copy size={12} />
//                 </Button>
//               </h4>
//               <p className="text-xs leading-relaxed text-muted-foreground bg-muted p-3 rounded italic">
//                 "{data.optimizedSummary}"
//               </p>
//             </div>

//             {/* High Impact Bullets */}
//             <div className="space-y-2">
//               <h4 className="font-bold text-sm">SUGGESTED EXPERIENCE TWEAKS</h4>
//               <ul className="space-y-3">
//                 {data?.suggestedBulletPoints?.map(
//                   (point: string, i: number) => (
//                     <li key={i} className="...">
//                       {point}
//                     </li>
//                   ),
//                 )}
//               </ul>
//             </div>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileDown,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { generateTailoredPDF } from "@/lib/pdf-helper";

export function TailorModal({ job, isOpen, onOpenChange }: any) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description || job.title,
        }),
      });
      const result = await res.json();
      if (res.status === 429) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      toast.error(err.message || "Failed to optimize resume.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-187.5 max-h-[90vh] flex flex-col bg-card border-primary/20 shadow-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Resume Optimizer{" "}
            <span className="text-primary/40 text-sm font-normal">
              | {job.company}
            </span>
          </DialogTitle>
          <DialogDescription>
            Aligning your profile with the specific requirements for {job.title}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 py-4 px-1 space-y-6">
          {!data && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-primary/10 rounded-xl">
              <p className="text-muted-foreground mb-4">
                No analysis performed yet.
              </p>
              <Button onClick={handleAnalyze} className="gap-2">
                Analyze & Tailor Resume
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-muted-foreground animate-pulse">
                Gemini is rewriting your bullet points...
              </p>
            </div>
          )}

          {data && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              {/* Keywords to Add  */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <h4 className="text-xs font-bold text-amber-600 uppercase flex items-center gap-2 mb-3">
                  <AlertCircle size={14} /> Missing Keywords for ATS
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.keyKeywordsMissing?.map((word: string) => (
                    <span
                      key={word}
                      className="px-2 py-1 bg-background text-[10px] font-mono border rounded"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggested Summary [cite: 26, 27] */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold flex justify-between items-center">
                  TAILORED PROFESSIONAL SUMMARY
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => {
                      navigator.clipboard.writeText(data.optimizedSummary);
                      toast.success("Summary copied");
                    }}
                  >
                    {" "}
                    <Copy size={12} className="mr-1" /> Copy{" "}
                  </Button>
                </h4>
                <div className="p-4 bg-muted/50 rounded-lg text-xs leading-relaxed italic border-l-4 border-primary/30">
                  "{data.optimizedSummary}"
                </div>
              </div>

              {/* Experience Tweaks  */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-tight text-primary/80">
                  Optimized Experience Bullets
                </h4>
                <div className="space-y-3">
                  {data.suggestedBulletPoints?.map(
                    (point: string, i: number) => (
                      <div
                        key={i}
                        className="flex gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs leading-relaxed"
                      >
                        <CheckCircle2
                          size={14}
                          className="text-emerald-500 shrink-0 mt-0.5"
                        />
                        {point}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t border-primary/5">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {data && (
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => generateTailoredPDF(data, job)}
            >
              <FileDown size={16} /> Download Tailored CV
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
