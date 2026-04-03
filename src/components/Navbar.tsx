"use client";

import { Rocket } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import Link from "next/link";
import { ProfileModal } from "./ProfileModal";

export default function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 w-full 
      /* 1. The Border: 2px with a purple tint to match your sidebar */
      border-b-2 border-primary/20 
      /* 2. The Shadow: Indigo glow that looks great in Dark Mode */
      shadow-[0_4px_20px_-5px_rgba(139,92,246,0.15)] 
      /* 3. The Glass Effect */
      bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 
      transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-black text-xl tracking-tighter hover:opacity-90 transition-opacity"
        >
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-lg shadow-primary/30">
            <Rocket size={20} />
          </div>
          <span className="bg-linear-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            REMOTE ROCKET
          </span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-4">
            <Link
              href="/"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Saved
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ProfileModal /> {/* Added this */}
            <div className="h-6 w-px bg-border/50 hidden md:block" />
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
