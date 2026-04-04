// "use client";

// import { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogTrigger,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { UserCircle, Loader2, Save, FileUp } from "lucide-react";
// import { toast } from "sonner";

// export function ProfileModal() {
//   const [resume, setResume] = useState("");
//   const [isSaving, setIsSaving] = useState(false);
//   const [isExtracting, setIsExtracting] = useState(false);
//   const [isOpen, setIsOpen] = useState(false);

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (file.type !== "application/pdf") {
//       toast.error("Please upload a PDF file.");
//       return;
//     }

//     if (resume && !confirm("This will replace the current text. Continue?")) {
//       e.target.value = "";
//       return;
//     }

//     setIsExtracting(true);
//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const res = await fetch("/api/extract-pdf", {
//         method: "POST",
//         body: formData,
//       });

//       if (!res.ok) throw new Error("Extraction failed");

//       const data = await res.json();
//       if (data.text) {
//         setResume(data.text);
//         toast.success("Resume text extracted!");
//       }
//     } catch (error) {
//       console.error("Upload Error:", error);
//       toast.error("Failed to read PDF. Please try copy-pasting.");
//     } finally {
//       setIsExtracting(false);
//       e.target.value = "";
//     }
//   };

//   const handleSave = async () => {
//     if (!resume.trim()) {
//       toast.error("Resume content cannot be empty.");
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const res = await fetch("/api/profile", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ resumeText: resume }),
//       });

//       if (res.ok) {
//         toast.success("Profile synced with Gemini!");
//         setIsOpen(false);
//       } else {
//         throw new Error("Save failed");
//       }
//     } catch (error) {
//       toast.error("Failed to save profile.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <Button
//           variant="ghost"
//           size="sm"
//           className="gap-2 text-muted-foreground hover:text-primary transition-colors"
//         >
//           <UserCircle size={20} />
//           <span className="hidden md:inline">My Profile</span>
//         </Button>
//       </DialogTrigger>

//       {/* LAYOUT ENGINE:
//           - max-h-[90vh]: Prevents modal from ever leaving the viewport.
//           - flex flex-col: Allows internal elements to share space properly.
//       */}
//       <DialogContent className="sm:max-w-162.5 max-h-[90vh] flex flex-col bg-card border-primary/20 shadow-2xl overflow-hidden">
//         <DialogHeader className="shrink-0 border-b border-primary/5 pb-4">
//           <div className="flex justify-between items-center pr-6">
//             <DialogTitle className="text-2xl font-bold tracking-tight">
//               Resume Agent
//             </DialogTitle>

//             <input
//               id="pdf-upload-input"
//               type="file"
//               accept=".pdf"
//               className="hidden"
//               onChange={handleFileUpload}
//             />

//             <Button
//               variant="outline"
//               size="sm"
//               disabled={isExtracting}
//               onClick={() =>
//                 document.getElementById("pdf-upload-input")?.click()
//               }
//               className="border-primary/20 hover:bg-primary/5 h-9"
//             >
//               {isExtracting ? (
//                 <Loader2 className="animate-spin mr-2" size={14} />
//               ) : (
//                 <FileUp className="mr-2 text-primary" size={14} />
//               )}
//               {isExtracting ? "Parsing..." : "Upload PDF"}
//             </Button>
//           </div>

//           <DialogDescription className="text-muted-foreground text-sm mt-1">
//             Provide your resume details so Gemini can calculate match scores and
//             draft custom pitches for you.
//           </DialogDescription>
//         </DialogHeader>

//         {/* SCROLLABLE CENTER:
//             - flex-1: Grows to fill all available space between header/footer.
//             - min-h-0: Essential for flex children to allow shrinking.
//         */}
//         <div className="flex-1 min-h-0 py-4 overflow-hidden">
//           <Textarea
//             placeholder="Upload a PDF or paste your CV text here..."
//             className="w-full h-full bg-background/50 border-primary/10 focus:border-primary/40 transition-all font-mono text-[11px] leading-relaxed resize-none overflow-y-auto p-4"
//             value={resume}
//             onChange={(e) => setResume(e.target.value)}
//           />
//         </div>

//         <DialogFooter className="shrink-0 gap-2 sm:gap-0 pt-4 border-t border-primary/5">
//           <Button variant="ghost" onClick={() => setIsOpen(false)}>
//             Cancel
//           </Button>
//           <Button
//             onClick={handleSave}
//             disabled={isSaving || isExtracting || !resume}
//             className="min-w-30 gap-2"
//           >
//             {isSaving ? (
//               <Loader2 className="animate-spin" size={16} />
//             ) : (
//               <Save size={16} />
//             )}
//             Save Profile
//           </Button>
//         </DialogFooter>
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  UserCircle,
  Loader2,
  Save,
  FileUp,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export function ProfileModal() {
  const [resume, setResume] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }

    setIsExtracting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.text) {
        setResume(data.text);
        toast.success("Resume text extracted!");
      }
    } catch (error) {
      toast.error("Failed to read PDF. Please try copy-pasting.");
    } finally {
      setIsExtracting(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!resume.trim()) return toast.error("Resume content cannot be empty.");
    if (!adminPassword.trim()) return toast.error("Admin password required.");

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resume, adminPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Admin Profile Updated!", {
          description: "Your live CV data is now synced with Gemini.",
        });
        setAdminPassword("");
        setIsOpen(false);
      } else if (res.status === 401) {
        // PROFESSIONAL PORTFOLIO ERROR
        toast("Identity Verification Failed", {
          description:
            "Database persistence is locked for guest users to prevent portfolio tampering.",
          icon: <ShieldAlert className="text-amber-500" size={18} />,
          duration: 6000,
        });
      } else {
        toast.error(data.error || "Save failed");
      }
    } catch (error) {
      toast.error("Connection error. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-primary"
        >
          <UserCircle size={20} />
          <span className="hidden md:inline">My Profile</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-162.5 max-h-[90vh] flex flex-col bg-card border-primary/20 shadow-2xl overflow-hidden">
        <DialogHeader className="shrink-0 border-b border-primary/5 pb-4">
          <div className="flex justify-between items-center pr-6">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Resume Agent
            </DialogTitle>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isExtracting}
              onClick={() => document.getElementById("pdf-upload")?.click()}
            >
              {isExtracting ? (
                <Loader2 className="animate-spin mr-2" size={14} />
              ) : (
                <FileUp className="mr-2 text-primary" size={14} />
              )}
              {isExtracting ? "Parsing..." : "Upload PDF"}
            </Button>
          </div>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Gemini uses this data to calculate match scores and draft pitches.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 py-4 flex flex-col gap-4 overflow-hidden">
          <Textarea
            placeholder="Paste CV text here..."
            className="flex-1 bg-background/50 border-primary/10 font-mono text-[11px] leading-relaxed resize-none p-4"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Lock size={12} className="text-primary" /> Admin Authorization
            </div>
            <Input
              type="password"
              placeholder="Enter password to sync changes..."
              className="h-9 bg-background/50 border-primary/10"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />

            {/* DEV NOTE FOR RECRUITERS */}
            <div className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
              <ShieldAlert
                className="text-amber-500 shrink-0 mt-0.5"
                size={14}
              />
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 leading-tight">
                <strong>Portfolio Security:</strong> Persistence is locked to
                prevent unauthorized tampering with production data. You may
                interact with the UI, but database writes require the admin key.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 pt-4 border-t border-primary/5">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isExtracting || !resume || !adminPassword}
            className="min-w-32 gap-2"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
