import type { ReactNode } from "react";
import { ToolDetailSidebar } from "@/components/tool-detail-sidebar";

interface ToolsLayoutProps {
  children: ReactNode;
}

export default function ToolsLayout({ children }: ToolsLayoutProps) {
  return (
    <div className="w-full px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-20">
          <ToolDetailSidebar />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}