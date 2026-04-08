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
  Terminal,
  Share2,
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

  // --- BRAND LOGIC ---
  // Detect if this is a Twitter/X lead (Handle starts with @)
  const isTwitterLead = job.company.startsWith("@");

  // UI States
  const [matchData, setMatchData] = useState<any>(null);
  const [letter, setLetter] = useState("");
  const [isTailorOpen, setIsTailorOpen] = useState(false);
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
      toast.success(`Signal marked as ${newStatus}`);
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
        loading: "Decoding match signals...",
        success: (data) => `Analysis complete: ${data.score}% match!`,
        error: () => {
          setActiveAction(null);
          return "Failed to decode signal.";
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
        loading: "Drafting intercept pitch...",
        success: "Pitch ready for transmission!",
        error: () => {
          setActiveAction(null);
          return "Generation failed.";
        },
      },
    );
  };

  return (
    <Card className="group border-primary/10 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden font-sans">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              {job.status === "applied" ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] py-0 px-2 h-5 font-mono">
                  <CheckCircle2 size={10} className="mr-1" /> SECURED
                </Badge>
              ) : (
                <Badge
                  className={`text-[10px] py-0 px-2 h-5 font-mono border-none ${
                    isTwitterLead
                      ? "bg-purple-500/10 text-purple-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {isTwitterLead ? (
                    <span className="flex items-center gap-1">
                      <Share2 size={10} /> X-SIGNAL
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> NEW LEAD
                    </span>
                  )}
                </Badge>
              )}
            </div>

            <CardTitle className="text-xl font-display font-bold group-hover:text-primary transition-colors tracking-tight">
              {job.title}
            </CardTitle>

            <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                {isTwitterLead ? (
                  <Terminal size={14} className="text-primary" />
                ) : (
                  <Building2 size={14} />
                )}
                {job.company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {job.location || "Remote"}
              </span>
            </div>
          </div>

          {matchData?.score && (
            <div className="flex flex-col items-end">
              <div className="text-2xl font-display font-black text-primary">
                {matchData.score}%
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                Match
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm line-clamp-3 text-muted-foreground/80 leading-relaxed font-sans">
          {job.description}
        </p>

        {matchData && (
          <div className="pt-4 border-t border-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono">
                  [Match]
                </p>
                <div className="flex flex-wrap gap-1">
                  {matchData.matching_skills?.map((s: string) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="bg-emerald-500/5 text-emerald-500/80 border-none text-[10px] font-mono"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">
                  [Gap]
                </p>
                <div className="flex flex-wrap gap-1">
                  {matchData.missing_skills?.map((s: string) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="bg-amber-500/5 text-amber-500/80 border-none text-[10px] font-mono"
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

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 bg-primary/5 py-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={analyzeMatch}
            disabled={!!activeAction}
            className="h-8 hover:bg-primary/10 text-xs font-bold uppercase tracking-tighter"
          >
            {activeAction === "analyzing" ? (
              <Loader2 className="animate-spin mr-2" size={12} />
            ) : (
              <Sparkles className="mr-2 text-primary" size={12} />
            )}
            Analyze
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTailorOpen(true)}
            disabled={!!activeAction}
            className="h-8 hover:bg-primary/10 text-xs font-bold uppercase tracking-tighter"
          >
            <Wand2 className="mr-2 text-primary" size={12} />
            Tailor
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={generatePitch}
            disabled={!!activeAction}
            className="h-8 hover:bg-primary/10 text-xs font-bold uppercase tracking-tighter"
          >
            {activeAction === "pitching" ? (
              <Loader2 className="animate-spin mr-2" size={12} />
            ) : (
              <FileText className="mr-2 text-primary" size={12} />
            )}
            Pitch
          </Button>

          {job.status !== "applied" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => statusMutation.mutate("applied")}
              disabled={!!activeAction}
              className="h-8 hover:bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-tighter"
            >
              {activeAction === "status" ? (
                <Loader2 className="animate-spin mr-2" size={12} />
              ) : (
                <CheckCircle2 className="mr-2" size={12} />
              )}
              Secure
            </Button>
          )}
        </div>

        <Button
          size="sm"
          asChild
          className="h-8 ml-auto font-bold uppercase tracking-widest text-[10px]"
          disabled={!!activeAction}
        >
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2"
          >
            {isTwitterLead ? "Intercept Tweet" : "Apply Now"}{" "}
            <ExternalLink size={12} />
          </a>
        </Button>
      </CardFooter>

      {/* --- Cover Letter Modal --- */}
      <Dialog open={!!letter} onOpenChange={() => setLetter("")}>
        {/* We keep max-h-[90vh] but ensure the content inside respects it */}
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col bg-card border-primary/20">
          <DialogHeader className="flex-none">
            <DialogTitle className="flex items-center gap-2 text-2xl font-display font-black">
              <Terminal className="text-primary" /> ENCRYPTED PITCH
            </DialogTitle>
          </DialogHeader>

          {/* SCROLLABLE AREA: Added overflow-y-auto and flex-1 */}
          <div className="relative mt-4 p-6 bg-background/50 rounded-xl border border-primary/10 overflow-y-auto flex-1 custom-scrollbar">
            <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-foreground/90">
              {letter}
            </div>
          </div>

          <DialogFooter className="mt-6 flex-none">
            <Button variant="ghost" onClick={() => setLetter("")}>
              Discard
            </Button>
            <Button
              className="gap-2 font-bold"
              onClick={() => {
                navigator.clipboard.writeText(letter);
                toast.success("Signal copied to clipboard!");
              }}
            >
              <Copy size={16} /> Copy Transmission
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
