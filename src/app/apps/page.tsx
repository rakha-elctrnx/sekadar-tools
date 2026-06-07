"use client";

import { Database, Search, BarChart3, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AppCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href?: string;
  category: string;
  tags: string[];
  isNew?: boolean;
  isComingSoon?: boolean;
}

const apps: AppCard[] = [
  {
    title: "Elasticsearch",
    description:
      "A comprehensive app to manage and explore data in Elasticsearch. Run queries, view indices, and analyze data in real-time.",
    icon: Search,
    href: "/apps/elasticsearch",
    category: "Data",
    tags: ["Elasticsearch", "Query", "Search Engine"],
    isNew: true,
  },
  {
    title: "Log Viewer",
    description:
      "Visualize and analyze logs from various sources. Filter, search, and tail logs in real-time.",
    icon: Terminal,
    category: "DevOps",
    tags: ["Logs", "Monitoring", "Real-time"],
    isComingSoon: true,
  },
  {
    title: "Dashboard Builder",
    description:
      "Build data visualization dashboards from various sources like APIs, databases, and CSV files.",
    icon: BarChart3,
    category: "Analytics",
    tags: ["Dashboard", "Visualization", "Charts"],
    isComingSoon: true,
  },
];

export default function AppsPage() {
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
              <Database className="size-3" />
              Applications
            </div>

            <div className="mx-auto max-w-3xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Apps{" "}
                <span className="bg-linear-to-r from-[#c5030c] via-[#d83b42] to-[#8f0f17] bg-clip-text text-transparent">
                  Collection
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Practical applications to help streamline your development workflow.
              Manage, visualize, and explore your data with ease.
              </p>
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <AppCardComponent key={app.title} app={app} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppCardComponent({ app }: { app: AppCard }) {
  const Icon = app.icon;

  const cardContent = (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-md dark:hover:border-border">
      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground/70 transition-colors group-hover:bg-[#c5030c]/10 group-hover:text-[#c5030c] dark:group-hover:text-[#c5030c]">
            <Icon className="size-5" />
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="h-5 border-border/80 bg-background px-1.5 text-[10px] font-medium text-muted-foreground"
            >
              {app.category}
            </Badge>
            {app.isNew && (
              <Badge className="h-5 border-none bg-[#c5030c] px-1.5 text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-[#c5030c]">
                New
              </Badge>
            )}
            {app.isComingSoon && (
              <Badge className="h-5 border-none bg-muted px-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Soon
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-[15px] font-semibold leading-tight text-foreground transition-colors group-hover:text-foreground/80">
            {app.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {app.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {app.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (app.href && !app.isComingSoon) {
    return (
      <a href={app.href} className="group block">
        {cardContent}
      </a>
    );
  }

  return (
    <div className="group block cursor-default opacity-70 transition-opacity hover:opacity-100">
      {cardContent}
    </div>
  );
}