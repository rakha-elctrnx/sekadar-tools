"use client";

import { useMemo, useState } from "react";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { tools } from "@/lib/tools";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [keyword, setKeyword] = useState("");

  const categories = useMemo(
    () => ["All", ...new Set(tools.map((tool) => tool.category))],
    []
  );

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
        <div className="mb-8 space-y-3 rounded-xl border border-border/60 bg-card/50 p-3 sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari tool atau tag..."
              className="h-9 bg-background pl-9"
              aria-label="Cari tool"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className="h-7"
              >
                {category}
              </Button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              {filteredTools.length} tool
            </span>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Tidak ada tool yang cocok dengan filter saat ini.
            </p>
          </div>
        )}

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            More tools coming soon — stay tuned! ✨
          </p>
        </div>
      </div>
    </div>
  );
}
