"use client";

import { Rocket, Search } from "lucide-react"; // Added Search icon
import { ModeToggle } from "@/components/ModeToggle";
import Link from "next/link";
import { ProfileModal } from "./ProfileModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Local state for the input value
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Update the URL when the user stops typing (Debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentQ = searchParams.get("q") || "";

      // ONLY push if the value is actually different to break the loop
      if (query.trim() !== currentQ.trim()) {
        if (query.trim()) {
          params.set("q", query);
        } else {
          params.delete("q");
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query]); // Only depend on query

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-primary/20 shadow-[0_4px_20px_-5px_rgba(139,92,246,0.15)] bg-background/95 backdrop-blur transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-black text-xl tracking-tighter shrink-0"
        >
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-lg shadow-primary/30">
            <Rocket size={20} />
          </div>
          <span className="bg-linear-to-r from-primary to-purple-400 bg-clip-text text-transparent hidden sm:block">
            REMOTE ROCKET
          </span>
        </Link>

        {/* --- The Search Bar --- */}
        <div className="flex-1 max-w-md relative group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
            size={16}
          />
          <Input
            placeholder="Search titles, companies, or tech..."
            className="pl-10 bg-muted/50 border-primary/10 focus-visible:ring-primary/20"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden lg:flex items-center gap-6 mr-4">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Dashboard
            </Link>
          </div>
          <ProfileModal />
          <div className="h-6 w-px bg-border/50 hidden md:block" />
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
