"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Send, Lock, ShieldAlert, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { jobService } from "@/services/jobService";

interface ApplicationDraft {
  email: { subject: string; body: string };
  resume: {
    optimizedSummary: string;
    suggestedBulletPoints: string[];
    keyKeywordsMissing: string[];
  };
  generatedAt: string;
}

interface ApplicationModalJob {
  id: string;
  title: string;
  company: string;
  description?: string;
  application_email?: string | null;
  application_draft?: ApplicationDraft | null;
}

type ApplicationModalProps = {
  job: ApplicationModalJob;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

type SendError = Error & { status?: number };

export function ApplicationModal({ job, isOpen, onOpenChange }: ApplicationModalProps) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState(job.application_email || "");
  const [draft, setDraft] = useState<ApplicationDraft | null>(
    job.application_draft || null,
  );
  const [subject, setSubject] = useState(job.application_draft?.email.subject || "");
  const [body, setBody] = useState(job.application_draft?.email.body || "");
  const [adminPassword, setAdminPassword] = useState("");

  const effectiveEmail = job.application_email || email;

  const saveEmailMutation = useMutation({
    mutationFn: (value: string) => jobService.updateApplicationEmail(job.id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Application email saved");
    },
    onError: () => toast.error("Failed to save email"),
  });

  const draftMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/applications/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft generation failed");
      return data as ApplicationDraft;
    },
    onSuccess: (data) => {
      setDraft(data);
      setSubject(data.email.subject);
      setBody(data.email.body);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Draft ready — review before sending");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/applications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, adminPassword, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err: SendError = new Error(data.error || "Send failed");
        err.status = res.status;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-counts"] });
      toast.success("Application sent!");
      setAdminPassword("");
      onOpenChange(false);
    },
    onError: (err: SendError) => {
      if (err.status === 401) {
        toast("Identity Verification Failed", {
          description: "Sending applications requires the admin key.",
          icon: <ShieldAlert className="text-amber-500" size={18} />,
          duration: 6000,
        });
      } else {
        toast.error(err.message);
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-187.5 max-h-[90vh] flex flex-col bg-card border-primary/20 shadow-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Apply{" "}
            <span className="text-primary/40 text-sm font-normal">
              | {job.company}
            </span>
          </DialogTitle>
          <DialogDescription>
            Draft and send a real application email for {job.title}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 py-4 px-1 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Mail size={12} className="text-primary" /> Application Email
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="recruiter@company.com"
                className="h-9 bg-background/50 border-primary/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!email.trim() || saveEmailMutation.isPending}
                onClick={() => saveEmailMutation.mutate(email)}
              >
                {saveEmailMutation.isPending ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {!draft && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-primary/10 rounded-xl">
              <p className="text-muted-foreground mb-4 text-sm text-center px-4">
                {effectiveEmail
                  ? "Generate a tailored application email and resume."
                  : "Save an application email above first."}
              </p>
              <Button
                onClick={() => draftMutation.mutate()}
                disabled={!effectiveEmail || draftMutation.isPending}
                className="gap-2"
              >
                {draftMutation.isPending && (
                  <Loader2 className="animate-spin" size={16} />
                )}
                Generate Draft
              </Button>
            </div>
          )}

          {draft && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <label
                  className="text-xs font-bold text-muted-foreground uppercase tracking-widest"
                  htmlFor="application-subject"
                >
                  Subject
                </label>
                <Input
                  id="application-subject"
                  className="bg-background/50 border-primary/10"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-bold text-muted-foreground uppercase tracking-widest"
                  htmlFor="application-body"
                >
                  Body
                </label>
                <Textarea
                  id="application-body"
                  className="min-h-56 bg-background/50 border-primary/10 font-mono text-xs leading-relaxed"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Paperclip size={12} /> Tailored resume PDF will be attached.
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <Lock size={12} className="text-primary" /> Admin Authorization
                </div>
                <Input
                  type="password"
                  placeholder="Enter password to send..."
                  className="h-9 bg-background/50 border-primary/10"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t border-primary/5">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {draft && (
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={
                !subject.trim() ||
                !body.trim() ||
                !adminPassword.trim() ||
                sendMutation.isPending
              }
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Send size={16} />
              )}
              Send Application
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
