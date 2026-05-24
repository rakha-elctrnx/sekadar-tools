import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  category: string;
  tags: string[];
  isNew?: boolean;
}

export function ToolCard({
  title,
  description,
  href,
  icon: Icon,
  category,
  tags,
  isNew,
}: ToolCardProps) {
  const previewTags = tags.slice(0, 2);

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-md dark:hover:border-border">
        <div className="relative space-y-2.5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground/70 transition-colors group-hover:bg-[#c5030c]/10 group-hover:text-[#c5030c] dark:group-hover:text-[#c5030c]">
              <Icon className="size-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="h-5 border-border/80 bg-background px-1.5 text-[10px] font-medium text-muted-foreground"
              >
                {category}
              </Badge>
              {isNew && (
                <Badge className="h-5 border-none bg-[#c5030c] px-1.5 text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-[#c5030c]">
                  New
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-[15px] font-semibold leading-tight text-foreground transition-colors group-hover:text-foreground/80">
              {title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {description}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {previewTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {tags.length > previewTags.length && (
              <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                +{tags.length - previewTags.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
