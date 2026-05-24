"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { tools } from "@/lib/tools";

export function ToolDetailSidebar() {
  const pathname = usePathname();
  const [keyword, setKeyword] = useState("");

  const filteredTools = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return tools;
    }

    return tools.filter((tool) => {
      return (
        tool.title.toLowerCase().includes(normalizedKeyword) ||
        tool.category.toLowerCase().includes(normalizedKeyword) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword))
      );
    });
  }, [keyword]);

  // Group tools by category
  const groupedTools = useMemo(() => {
    const groups: Record<string, typeof filteredTools> = {};
    for (const tool of filteredTools) {
      if (!groups[tool.category]) {
        groups[tool.category] = [];
      }
      groups[tool.category].push(tool);
    }
    return groups;
  }, [filteredTools]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        
        <h2 className="font-heading text-sm font-semibold tracking-tight">
          All Tools
        </h2>
        <Badge
          variant="secondary"
          className="ml-auto h-5 rounded-full px-1.5 text-[10px] font-medium"
        >
          {tools.length}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Search tools..."
          className="h-8 rounded-lg border-border/50 bg-muted/40 pl-8.5 text-xs placeholder:text-muted-foreground/60 focus-visible:bg-background"
          aria-label="Search tools in sidebar"
        />
      </div>

      {/* Tool list grouped by category */}
      <nav className="flex flex-col gap-4" aria-label="Tools navigation">
        {Object.entries(groupedTools).map(([category, categoryTools]) => (
          <div key={category} className="flex flex-col gap-0.5">
            <span className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {category}
            </span>
            {categoryTools.map((tool) => {
              const isActive = pathname === tool.href;
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-[#c5030c]/10 text-foreground shadow-sm shadow-[#c5030c]/5"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#c5030c]" />
                  )}

                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
                      isActive
                        ? "bg-[#c5030c]/15 text-[#c5030c]"
                        : "bg-muted/80 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>

                  <span className="truncate">{tool.title}</span>

                  {tool.isNew && (
                    <span className="ml-auto shrink-0 rounded-full bg-[#c5030c]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#c5030c]">
                      New
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {filteredTools.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 px-4 py-8 text-center">
          <Search className="size-5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            Tidak ada tool yang cocok.
          </p>
        </div>
      )}
    </div>
  );
}
