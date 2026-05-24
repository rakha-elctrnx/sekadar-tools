import type { LucideIcon } from "lucide-react";

interface ToolDetailHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ToolDetailHeader({
  title,
  description,
  icon: Icon,
}: ToolDetailHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="absolute inset-0 bg-linear-to-br from-[#c5030c]/5 via-transparent to-transparent" />
      <div className="relative flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#c5030c] shadow-sm shadow-[#c5030c]/20">
          <Icon className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}