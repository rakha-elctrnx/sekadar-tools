"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-3">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Search..."
          className="h-9 bg-background pl-9"
          aria-label="Search tools in sidebar"
        />
      </div>

      <div className="space-y-1">
        {filteredTools.map((tool) => {
          const isActive = pathname === tool.href;
          const Icon = tool.icon;

          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-[#c5030c]/30 bg-[#c5030c]/10 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{tool.title}</span>
            </Link>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Tool tidak ditemukan.
        </p>
      )}
    </div>
  );
}