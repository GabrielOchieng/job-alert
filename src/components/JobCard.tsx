"use client";

import { useState } from "react";
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
  CheckCircle2,
  MapPin,
  Building2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
}

export default function JobCard({ job }: { job: Job }) {
  // --- States ---
  const [matchData, setMatchData] = useState<any>(null);
  const [letter, setLetter] = useState("");
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);

  const analyzeMatch = async () => {
    setIsLoadingMatch(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        // REQUIRED: Tell the server we are sending JSON
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Match the server expectation + provide fallback
          jobId: job.id,
          jobDescription: job.description || job.title,
        }),
      });
      const data = await res.json();
      setMatchData(data);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze job match.");
    } finally {
      setIsLoadingMatch(false);
    }
  };

  // --- Logic: Generate Pitch ---
  const generatePitch = async () => {
    setIsGeneratingPitch(true);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        // REQUIRED: Tell the server we are sending JSON
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description || job.title,
        }),
      });
      const data = await res.json();
      setLetter(data.letter);
    } catch (error) {
      toast.error("Failed to generate pitch.");
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  return (
    <Card className="group border-primary/10 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
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
        {/* Job Snippet */}
        <p className="text-sm line-clamp-3 text-muted-foreground leading-relaxed">
          {job.description}
        </p>

        {/* AI Insights (Only shown if analyzed) */}
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
            <p className="text-xs italic text-muted-foreground bg-primary/5 p-2 rounded border-l-2 border-primary/20">
              "{matchData.brief_analysis}"
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-2 pt-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeMatch}
            disabled={isLoadingMatch}
            className="h-9 px-4 border-primary/20 hover:bg-primary/5 transition-colors"
          >
            {isLoadingMatch ? (
              <Loader2 className="animate-spin mr-2" size={14} />
            ) : (
              <Sparkles className="mr-2 text-primary" size={14} />
            )}
            {matchData ? "Re-Analyze" : "Analyze Match"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={generatePitch}
            disabled={isGeneratingPitch}
            className="h-9 px-4 border-primary/20 hover:bg-primary/5"
          >
            {isGeneratingPitch ? (
              <Loader2 className="animate-spin mr-2" size={14} />
            ) : (
              <FileText className="mr-2 text-primary" size={14} />
            )}
            Pitch Me
          </Button>
        </div>

        <Button size="sm" asChild className="h-9">
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2"
          >
            Apply <ExternalLink size={14} />
          </a>
        </Button>
      </CardFooter>

      {/* --- Cover Letter Modal --- */}
      <Dialog open={!!letter} onOpenChange={() => setLetter("")}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="text-primary" /> Tailored Pitch
            </DialogTitle>
            <p className="text-sm text-muted-foreground italic">
              Tailored for {job.title} at {job.company}
            </p>
          </DialogHeader>

          <div className="relative mt-4 p-6 bg-muted/40 rounded-xl border border-primary/10">
            <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif">
              {letter}
            </div>
          </div>

          <DialogFooter className="mt-6 flex sm:justify-between w-full">
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
              <Copy size={16} /> Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
