// // "use client";

// // import { useState } from "react";
// // import { useMutation, useQueryClient } from "@tanstack/react-query";
// // import { jobService } from "@/services/jobService";
// // import {
// //   Card,
// //   CardContent,
// //   CardFooter,
// //   CardHeader,
// //   CardTitle,
// // } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogHeader,
// //   DialogTitle,
// //   DialogFooter,
// // } from "@/components/ui/dialog";
// // import {
// //   Loader2,
// //   FileText,
// //   Sparkles,
// //   Copy,
// //   Building2,
// //   MapPin,
// //   ExternalLink,
// //   Wand2,
// //   CheckCircle2,
// //   Clock,
// // } from "lucide-react";
// // import { toast } from "sonner";
// // import { TailorModal } from "./TailorModal";

// // interface Job {
// //   id: string;
// //   title: string;
// //   company: string;
// //   location: string;
// //   description: string;
// //   url: string;
// //   status?: string;
// // }

// // export default function JobCard({ job }: { job: Job }) {
// //   const queryClient = useQueryClient();
// //   const [matchData, setMatchData] = useState<any>(null);
// //   const [letter, setLetter] = useState("");
// //   const [isLoadingMatch, setIsLoadingMatch] = useState(false);
// //   const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
// //   const [isTailorOpen, setIsTailorOpen] = useState(false);

// //   // --- Mutation for Updating Status ---
// //   const statusMutation = useMutation({
// //     mutationFn: (newStatus: string) =>
// //       jobService.updateJobStatus(job.id, newStatus),
// //     onSuccess: () => {
// //       // Invalidate both jobs and counts to trigger a UI-wide refresh
// //       queryClient.invalidateQueries({ queryKey: ["jobs"] });
// //       queryClient.invalidateQueries({ queryKey: ["job-counts"] });
// //       toast.success("Status updated successfully!");
// //     },
// //     onError: () => {
// //       toast.error("Failed to update job status.");
// //     },
// //   });

// //   const analyzeMatch = async () => {
// //     setIsLoadingMatch(true);
// //     try {
// //       const res = await fetch("/api/match", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           jobId: job.id,
// //           jobDescription: job.description || job.title,
// //         }),
// //       });
// //       const data = await res.json();
// //       setMatchData(data);
// //       toast.success("Analysis complete!");
// //     } catch (error) {
// //       toast.error("Failed to analyze job match.");
// //     } finally {
// //       setIsLoadingMatch(false);
// //     }
// //   };

// //   const generatePitch = async () => {
// //     setIsGeneratingPitch(true);
// //     try {
// //       const res = await fetch("/api/cover-letter", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           jobTitle: job.title,
// //           company: job.company,
// //           jobDescription: job.description || job.title,
// //         }),
// //       });
// //       const data = await res.json();
// //       setLetter(data.letter);
// //     } catch (error) {
// //       toast.error("Failed to generate pitch.");
// //     } finally {
// //       setIsGeneratingPitch(false);
// //     }
// //   };

// //   return (
// //     <Card className="group border-primary/10 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden">
// //       <CardHeader className="pb-2">
// //         <div className="flex justify-between items-start">
// //           <div className="space-y-1">
// //             <div className="flex items-center gap-2 mb-1">
// //               {job.status === "applied" ? (
// //                 <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 text-[10px] py-0 px-2 h-5">
// //                   <CheckCircle2 size={10} className="mr-1" /> Applied
// //                 </Badge>
// //               ) : (
// //                 <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 text-[10px] py-0 px-2 h-5">
// //                   <Clock size={10} className="mr-1" /> New Lead
// //                 </Badge>
// //               )}
// //             </div>
// //             <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
// //               {job.title}
// //             </CardTitle>
// //             <div className="flex items-center gap-3 text-sm text-muted-foreground">
// //               <span className="flex items-center gap-1">
// //                 <Building2 size={14} /> {job.company}
// //               </span>
// //               <span className="flex items-center gap-1">
// //                 <MapPin size={14} /> {job.location}
// //               </span>
// //             </div>
// //           </div>
// //           {matchData?.score && (
// //             <div className="flex flex-col items-end">
// //               <div className="text-2xl font-black text-primary">
// //                 {matchData.score}%
// //               </div>
// //               <span className="text-[10px] uppercase tracking-wider font-bold opacity-50">
// //                 Match Score
// //               </span>
// //             </div>
// //           )}
// //         </div>
// //       </CardHeader>

// //       <CardContent className="space-y-4">
// //         <p className="text-sm line-clamp-3 text-muted-foreground leading-relaxed">
// //           {job.description}
// //         </p>

// //         {matchData && (
// //           <div className="pt-4 border-t border-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2">
// //             <div className="grid grid-cols-2 gap-4">
// //               <div className="space-y-2">
// //                 <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
// //                   Matching
// //                 </p>
// //                 <div className="flex flex-wrap gap-1">
// //                   {matchData.matching_skills?.map((s: string) => (
// //                     <Badge
// //                       key={s}
// //                       variant="secondary"
// //                       className="bg-emerald-500/10 text-emerald-600 border-none text-[10px]"
// //                     >
// //                       {s}
// //                     </Badge>
// //                   ))}
// //                 </div>
// //               </div>
// //               <div className="space-y-2">
// //                 <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
// //                   Missing
// //                 </p>
// //                 <div className="flex flex-wrap gap-1">
// //                   {matchData.missing_skills?.map((s: string) => (
// //                     <Badge
// //                       key={s}
// //                       variant="secondary"
// //                       className="bg-amber-500/10 text-amber-600 border-none text-[10px]"
// //                     >
// //                       {s}
// //                     </Badge>
// //                   ))}
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //       </CardContent>

// //       <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-2">
// //         <div className="flex flex-wrap gap-2">
// //           {/* Analyze Button */}
// //           <Button
// //             variant="outline"
// //             size="sm"
// //             onClick={analyzeMatch}
// //             disabled={isLoadingMatch}
// //             className="h-8 border-primary/20 hover:bg-primary/5"
// //           >
// //             {isLoadingMatch ? (
// //               <Loader2 className="animate-spin mr-2" size={12} />
// //             ) : (
// //               <Sparkles className="mr-2 text-primary" size={12} />
// //             )}
// //             {matchData ? "Re-Analyze" : "Analyze"}
// //           </Button>

// //           {/* Tailor Resume Button */}
// //           <Button
// //             variant="outline"
// //             size="sm"
// //             onClick={() => setIsTailorOpen(true)}
// //             className="h-8 border-primary/20 hover:bg-primary/5"
// //           >
// //             <Wand2 className="mr-2 text-primary" size={12} />
// //             Tailor CV
// //           </Button>

// //           {/* Pitch Button */}
// //           <Button
// //             variant="outline"
// //             size="sm"
// //             onClick={generatePitch}
// //             disabled={isGeneratingPitch}
// //             className="h-8 border-primary/20 hover:bg-primary/5"
// //           >
// //             {isGeneratingPitch ? (
// //               <Loader2 className="animate-spin mr-2" size={12} />
// //             ) : (
// //               <FileText className="mr-2 text-primary" size={12} />
// //             )}
// //             Pitch Me
// //           </Button>

// //           {/* --- Mark as Applied Button --- */}
// //           {job.status !== "applied" && (
// //             <Button
// //               variant="outline"
// //               size="sm"
// //               onClick={() => statusMutation.mutate("applied")}
// //               disabled={statusMutation.isPending}
// //               className="h-8 border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-600"
// //             >
// //               {statusMutation.isPending ? (
// //                 <Loader2 className="animate-spin mr-2" size={12} />
// //               ) : (
// //                 <CheckCircle2 className="mr-2" size={12} />
// //               )}
// //               Mark Applied
// //             </Button>
// //           )}
// //         </div>

// //         <Button size="sm" asChild className="h-8 ml-auto">
// //           <a
// //             href={job.url}
// //             target="_blank"
// //             rel="noreferrer"
// //             className="flex items-center gap-2"
// //           >
// //             Apply <ExternalLink size={12} />
// //           </a>
// //         </Button>
// //       </CardFooter>

// //       {/* --- Cover Letter Modal --- */}
// //       <Dialog open={!!letter} onOpenChange={() => setLetter("")}>
// //         <DialogContent className="sm:max-w-162.5 max-h-[90vh] overflow-y-auto">
// //           <DialogHeader>
// //             <DialogTitle className="flex items-center gap-2 text-2xl">
// //               <Sparkles className="text-primary" /> Tailored Pitch
// //             </DialogTitle>
// //           </DialogHeader>
// //           <div className="relative mt-4 p-6 bg-muted/40 rounded-xl border border-primary/10">
// //             <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif">
// //               {letter}
// //             </div>
// //           </div>
// //           <DialogFooter className="mt-6">
// //             <Button variant="ghost" onClick={() => setLetter("")}>
// //               Discard
// //             </Button>
// //             <Button
// //               className="gap-2"
// //               onClick={() => {
// //                 navigator.clipboard.writeText(letter);
// //                 toast.success("Copied to clipboard!");
// //               }}
// //             >
// //               <Copy size={16} /> Copy
// //             </Button>
// //           </DialogFooter>
// //         </DialogContent>
// //       </Dialog>

// //       <TailorModal
// //         job={job}
// //         isOpen={isTailorOpen}
// //         onOpenChange={setIsTailorOpen}
// //       />
// //     </Card>
// //   );
// // }

// "use client";

// import { useState } from "react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { jobService } from "@/services/jobService";
// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import {
//   Loader2,
//   FileText,
//   Sparkles,
//   Copy,
//   Building2,
//   MapPin,
//   ExternalLink,
//   Wand2,
//   CheckCircle2,
//   Clock,
// } from "lucide-react";
// import { toast } from "sonner";
// import { TailorModal } from "./TailorModal";

// interface Job {
//   id: string;
//   title: string;
//   company: string;
//   location: string;
//   description: string;
//   url: string;
//   status?: string;
// }

// export default function JobCard({ job }: { job: Job }) {
//   const queryClient = useQueryClient();
//   const [matchData, setMatchData] = useState<any>(null);
//   const [letter, setLetter] = useState("");
//   const [isTailorOpen, setIsTailorOpen] = useState(false);

//   // --- 1. Status Update Mutation ---
//   const statusMutation = useMutation({
//     mutationFn: (newStatus: string) =>
//       jobService.updateJobStatus(job.id, newStatus),
//     onSuccess: (_, newStatus) => {
//       queryClient.invalidateQueries({ queryKey: ["jobs"] });
//       queryClient.invalidateQueries({ queryKey: ["job-counts"] });
//       toast.success(`Moved to ${newStatus}`, {
//         description: `This lead is now tracked in your ${newStatus} list.`,
//       });
//     },
//     onError: () => {
//       toast.error("Sync failed", {
//         description: "Could not update the job status in the database.",
//       });
//     },
//   });

//   // --- 2. AI Analysis with Toast Promise ---
//   const analyzeMatch = async () => {
//     // We don't need a local isLoading state because toast.promise handles the UI
//     toast.promise(
//       (async () => {
//         const res = await fetch("/api/match", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             jobId: job.id,
//             jobDescription: job.description || job.title,
//           }),
//         });
//         if (!res.ok) throw new Error("Analysis failed");
//         const data = await res.json();
//         setMatchData(data);
//         return data;
//       })(),
//       {
//         loading: "AI is analyzing your fit...",
//         success: (data) => `Analysis complete: ${data.score}% match!`,
//         error: "Failed to calculate match score.",
//       },
//     );
//   };

//   // --- 3. AI Pitch Generation with Toast Promise ---
//   const generatePitch = async () => {
//     toast.promise(
//       (async () => {
//         const res = await fetch("/api/cover-letter", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             jobTitle: job.title,
//             company: job.company,
//             jobDescription: job.description || job.title,
//           }),
//         });
//         if (!res.ok) throw new Error("Pitch failed");
//         const data = await res.json();
//         setLetter(data.letter);
//         return data;
//       })(),
//       {
//         loading: "AI is drafting your custom pitch...",
//         success: "Pitch is ready to review!",
//         error: "Could not generate a pitch for this role.",
//       },
//     );
//   };

//   return (
//     <Card className="group border-primary/10 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden">
//       <CardHeader className="pb-2">
//         <div className="flex justify-between items-start">
//           <div className="space-y-1">
//             <div className="flex items-center gap-2 mb-1">
//               {job.status === "applied" ? (
//                 <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] py-0 px-2 h-5">
//                   <CheckCircle2 size={10} className="mr-1" /> Applied
//                 </Badge>
//               ) : (
//                 <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] py-0 px-2 h-5">
//                   <Clock size={10} className="mr-1" /> New Lead
//                 </Badge>
//               )}
//             </div>
//             <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
//               {job.title}
//             </CardTitle>
//             <div className="flex items-center gap-3 text-sm text-muted-foreground">
//               <span className="flex items-center gap-1">
//                 <Building2 size={14} /> {job.company}
//               </span>
//               <span className="flex items-center gap-1">
//                 <MapPin size={14} /> {job.location}
//               </span>
//             </div>
//           </div>
//           {matchData?.score && (
//             <div className="flex flex-col items-end">
//               <div className="text-2xl font-black text-primary">
//                 {matchData.score}%
//               </div>
//               <span className="text-[10px] uppercase tracking-wider font-bold opacity-50">
//                 Match Score
//               </span>
//             </div>
//           )}
//         </div>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         <p className="text-sm line-clamp-3 text-muted-foreground leading-relaxed">
//           {job.description}
//         </p>

//         {matchData && (
//           <div className="pt-4 border-t border-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
//                   Matching
//                 </p>
//                 <div className="flex flex-wrap gap-1">
//                   {matchData.matching_skills?.map((s: string) => (
//                     <Badge
//                       key={s}
//                       variant="secondary"
//                       className="bg-emerald-500/10 text-emerald-600 border-none text-[10px]"
//                     >
//                       {s}
//                     </Badge>
//                   ))}
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
//                   Missing
//                 </p>
//                 <div className="flex flex-wrap gap-1">
//                   {matchData.missing_skills?.map((s: string) => (
//                     <Badge
//                       key={s}
//                       variant="secondary"
//                       className="bg-amber-500/10 text-amber-600 border-none text-[10px]"
//                     >
//                       {s}
//                     </Badge>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </CardContent>

//       <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-2">
//         <div className="flex flex-wrap gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={analyzeMatch}
//             className="h-8 border-primary/20 hover:bg-primary/5"
//           >
//             <Sparkles className="mr-2 text-primary" size={12} />
//             {matchData ? "Re-Analyze" : "Analyze"}
//           </Button>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setIsTailorOpen(true)}
//             className="h-8 border-primary/20 hover:bg-primary/5"
//           >
//             <Wand2 className="mr-2 text-primary" size={12} />
//             Tailor CV
//           </Button>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={generatePitch}
//             className="h-8 border-primary/20 hover:bg-primary/5"
//           >
//             <FileText className="mr-2 text-primary" size={12} />
//             Pitch Me
//           </Button>

//           {job.status !== "applied" && (
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => statusMutation.mutate("applied")}
//               disabled={statusMutation.isPending}
//               className="h-8 border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-600"
//             >
//               {statusMutation.isPending ? (
//                 <Loader2 className="animate-spin mr-2" size={12} />
//               ) : (
//                 <CheckCircle2 className="mr-2" size={12} />
//               )}
//               Mark Applied
//             </Button>
//           )}
//         </div>

//         <Button size="sm" asChild className="h-8 ml-auto">
//           <a
//             href={job.url}
//             target="_blank"
//             rel="noreferrer"
//             className="flex items-center gap-2"
//           >
//             Apply <ExternalLink size={12} />
//           </a>
//         </Button>
//       </CardFooter>

//       {/* --- Cover Letter Modal --- */}
//       <Dialog open={!!letter} onOpenChange={() => setLetter("")}>
//         <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2 text-2xl">
//               <Sparkles className="text-primary" /> Tailored Pitch
//             </DialogTitle>
//           </DialogHeader>
//           <div className="relative mt-4 p-6 bg-muted/40 rounded-xl border border-primary/10">
//             <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif">
//               {letter}
//             </div>
//           </div>
//           <DialogFooter className="mt-6">
//             <Button variant="ghost" onClick={() => setLetter("")}>
//               Discard
//             </Button>
//             <Button
//               className="gap-2"
//               onClick={() => {
//                 navigator.clipboard.writeText(letter);
//                 toast.success("Copied to clipboard!");
//               }}
//             >
//               <Copy size={16} /> Copy
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <TailorModal
//         job={job}
//         isOpen={isTailorOpen}
//         onOpenChange={setIsTailorOpen}
//       />
//     </Card>
//   );
// }

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobService } from "@/services/jobService";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  FileText,
  Sparkles,
  Copy,
  Building2,
  MapPin,
  ExternalLink,
  Wand2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { TailorModal } from "./TailorModal";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  status?: string;
}

export default function JobCard({ job }: { job: Job }) {
  const queryClient = useQueryClient();

  // UI States
  const [matchData, setMatchData] = useState<any>(null);
  const [letter, setLetter] = useState("");
  const [isTailorOpen, setIsTailorOpen] = useState(false);

  // Unified Loading Lock
  const [activeAction, setActiveAction] = useState<
    "analyzing" | "pitching" | "status" | null
  >(null);

  // --- 1. Status Update Mutation ---
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      jobService.updateJobStatus(job.id, newStatus),
    onMutate: () => setActiveAction("status"),
    onSettled: () => setActiveAction(null),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-counts"] });
      toast.success(`Moved to ${newStatus}`, {
        description: `This lead is now tracked in your ${newStatus} list.`,
      });
    },
    onError: () => {
      toast.error("Sync failed", {
        description: "Could not update the job status in the database.",
      });
    },
  });

  // --- 2. AI Analysis ---
  const analyzeMatch = async () => {
    setActiveAction("analyzing");
    toast.promise(
      (async () => {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: job.id,
            jobDescription: job.description || job.title,
          }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setMatchData(data);
        setActiveAction(null);
        return data;
      })(),
      {
        loading: "AI is analyzing your fit...",
        success: (data) => `Analysis complete: ${data.score}% match!`,
        error: () => {
          setActiveAction(null);
          return "Failed to calculate match score.";
        },
      },
    );
  };

  // --- 3. AI Pitch Generation ---
  const generatePitch = async () => {
    setActiveAction("pitching");
    toast.promise(
      (async () => {
        const res = await fetch("/api/cover-letter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: job.title,
            company: job.company,
            jobDescription: job.description || job.title,
          }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setLetter(data.letter);
        setActiveAction(null);
        return data;
      })(),
      {
        loading: "AI is drafting your custom pitch...",
        success: "Pitch is ready to review!",
        error: () => {
          setActiveAction(null);
          return "Could not generate a pitch.";
        },
      },
    );
  };

  return (
    <Card className="group border-primary/10 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              {job.status === "applied" ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] py-0 px-2 h-5">
                  <CheckCircle2 size={10} className="mr-1" /> Applied
                </Badge>
              ) : (
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] py-0 px-2 h-5">
                  <Clock size={10} className="mr-1" /> New Lead
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
              {job.title}
            </CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 size={14} /> {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {job.location}
              </span>
            </div>
          </div>
          {matchData?.score && (
            <div className="flex flex-col items-end">
              <div className="text-2xl font-black text-primary">
                {matchData.score}%
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-50">
                Match Score
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm line-clamp-3 text-muted-foreground leading-relaxed">
          {job.description}
        </p>

        {matchData && (
          <div className="pt-4 border-t border-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  Matching
                </p>
                <div className="flex flex-wrap gap-1">
                  {matchData.matching_skills?.map((s: string) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-600 border-none text-[10px]"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  Missing
                </p>
                <div className="flex flex-wrap gap-1">
                  {matchData.missing_skills?.map((s: string) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="bg-amber-500/10 text-amber-600 border-none text-[10px]"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex flex-wrap gap-2">
          {/* Analyze Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeMatch}
            disabled={!!activeAction}
            className="h-8 border-primary/20 hover:bg-primary/5"
          >
            {activeAction === "analyzing" ? (
              <Loader2 className="animate-spin mr-2" size={12} />
            ) : (
              <Sparkles className="mr-2 text-primary" size={12} />
            )}
            {matchData ? "Re-Analyze" : "Analyze"}
          </Button>

          {/* Tailor Resume Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTailorOpen(true)}
            disabled={!!activeAction}
            className="h-8 border-primary/20 hover:bg-primary/5"
          >
            <Wand2 className="mr-2 text-primary" size={12} />
            Tailor CV
          </Button>

          {/* Pitch Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={generatePitch}
            disabled={!!activeAction}
            className="h-8 border-primary/20 hover:bg-primary/5"
          >
            {activeAction === "pitching" ? (
              <Loader2 className="animate-spin mr-2" size={12} />
            ) : (
              <FileText className="mr-2 text-primary" size={12} />
            )}
            Pitch Me
          </Button>

          {/* Mark Applied Button */}
          {job.status !== "applied" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => statusMutation.mutate("applied")}
              disabled={!!activeAction}
              className="h-8 border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-600"
            >
              {activeAction === "status" ? (
                <Loader2 className="animate-spin mr-2" size={12} />
              ) : (
                <CheckCircle2 className="mr-2" size={12} />
              )}
              Mark Applied
            </Button>
          )}
        </div>

        <Button
          size="sm"
          asChild
          className="h-8 ml-auto"
          disabled={!!activeAction}
        >
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2"
          >
            Apply <ExternalLink size={12} />
          </a>
        </Button>
      </CardFooter>

      {/* --- Cover Letter Modal --- */}
      <Dialog open={!!letter} onOpenChange={() => setLetter("")}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="text-primary" /> Tailored Pitch
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-4 p-6 bg-muted/40 rounded-xl border border-primary/10">
            <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif">
              {letter}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setLetter("")}>
              Discard
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText(letter);
                toast.success("Copied to clipboard!");
              }}
            >
              <Copy size={16} /> Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TailorModal
        job={job}
        isOpen={isTailorOpen}
        onOpenChange={setIsTailorOpen}
      />
    </Card>
  );
}
