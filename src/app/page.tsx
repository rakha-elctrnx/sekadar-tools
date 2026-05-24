"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolCard } from "@/components/tool-card";
import { Input } from "@/components/ui/input";
import { Search, Download } from "lucide-react";
import { tools } from "@/lib/tools";
import Link from "next/link";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [keyword, setKeyword] = useState("");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [os, setOs] = useState("Your Device");

  useEffect(() => {
    // Detect OS
    const ua = navigator.userAgent;
    if (ua.includes("Win")) setOs("Windows");
    else if (ua.includes("Mac")) setOs("macOS");
    else if (ua.includes("Linux")) setOs("Linux");
    else if (ua.includes("Android")) setOs("Android");
    else if (ua.includes("iPhone") || ua.includes("iPad")) setOs("iOS");

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(tools.map((tool) => tool.category))],
    []
  );

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const filteredTools = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return tools.filter((tool) => {
      const inCategory =
        activeCategory === "All" || tool.category === activeCategory;
      const inKeyword =
        normalizedKeyword.length === 0 ||
        tool.title.toLowerCase().includes(normalizedKeyword) ||
        tool.description.toLowerCase().includes(normalizedKeyword) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword));

      return inCategory && inKeyword;
    });
  }, [activeCategory, keyword]);

  return (
    <div className="relative">
      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Hero */}
        <div className="relative mb-16 overflow-hidden px-2 py-12 text-center sm:px-6 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(127,127,127,0.10)_1px,transparent_1px),linear-gradient(to_bottom,transparent_27px,rgba(127,127,127,0.10)_27px,rgba(127,127,127,0.10)_28px,transparent_28px)] bg-size-[28px_28px] mask-[radial-gradient(circle_at_center,black_62%,transparent_100%)]"
          />

          <div className="relative space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[#c5030c] px-3.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Free &amp; Open Source
            </div>

            <div className="mx-auto max-w-3xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Developer{" "}
                <span className="bg-linear-to-r from-[#c5030c] via-[#d83b42] to-[#8f0f17] bg-clip-text text-transparent">
                  Utilities
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                A curated collection of fast, free tools that run entirely in
                your browser. No signups, no tracking, no BS.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                100% browser-based, zero friction
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-10 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Explore Tools
              </h2>
              <p className="text-sm text-muted-foreground">
                Browse by category or search for what you need
              </p>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Find a tool..."
                className="h-9 rounded-lg border-border/60 bg-background/60 pl-9 text-sm shadow-sm  placeholder:text-muted-foreground/60 focus-visible:ring-[#c5030c]/20"
                aria-label="Search tools"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                  activeCategory === category
                    ? "bg-[#c5030c] text-white shadow-md shadow-[#c5030c]/20"
                    : "border border-border/60 bg-background/80 text-muted-foreground hover:border-[#c5030c]/30 hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No tools match your current filters. Try a different category or
              keyword.
            </p>
          </div>
        )}

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            More tools coming soon — stay tuned! ✨
          </p>
        </div>

        {/* Install PWA */}
        <div className="mt-16 rounded-2xl border border-border/60 bg-muted/30 px-6 py-12 text-center sm:px-12">
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c5030c]/30 bg-[#c5030c]/10 px-3.5 py-1 text-xs font-medium text-[#c5030c]">
              Works Offline
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your tools.{" "}
              <span className="bg-linear-to-r from-[#c5030c] via-[#d83b42] to-[#8f0f17] bg-clip-text text-transparent">
                Your machine.
              </span>
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Stop uploading your sensitive keys and JSON to random servers. Get
              100% offline, privacy-first developer utilities right on your
              machine.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              {!isInstalled && (
                <button
                  onClick={handleInstall}
                  disabled={!deferredPrompt}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#c5030c] px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-[#c5030c]/20 transition-all hover:bg-[#a50209] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="size-4" />
                  Install App for {os}
                </button>
              )}
              {isInstalled && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-2.5 text-sm font-medium text-green-600 dark:text-green-400">
                  ✓ App Installed
                </div>
              )}
              <Link
                href="https://github.com/rakha-elctrnx/sekadar-tools"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:border-[#c5030c]/30 hover:text-foreground"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Contribute Code
              </Link>
            </div>
            {!deferredPrompt && !isInstalled && (
              <p className="text-xs text-muted-foreground/70">
                Use Chrome, Edge, or another Chromium browser to install as an
                app.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
