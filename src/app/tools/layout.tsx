import type { ReactNode } from "react";
import { ToolDetailSidebar } from "@/components/tool-detail-sidebar";

interface ToolsLayoutProps {
  children: ReactNode;
}

export default function ToolsLayout({ children }: ToolsLayoutProps) {
  return (
    <div className="relative w-full">
      {/* Background grid - full width at the top, but clipped to avoid sidebar */}
      <div
        className="pointer-events-none absolute top-0 right-0 left-[calc(300px+3rem)] h-72 overflow-hidden max-lg:inset-x-0"
        aria-hidden="true"
      >
        {/* Vertical lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.5 0 0 / 0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Horizontal lines skewed slightly to the right */}
        <div
          className="absolute -top-24 -right-24 -left-4 -bottom-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, oklch(0.5 0 0 / 0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            transform: "skewY(5deg)",
            transformOrigin: "top left",
          }}
        />
        {/* Fade edges: bottom, right, left */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background" />
        {/* Highlighted cell - skewed to match horizontal lines */}
        <div
          className="absolute z-10"
          style={{
            top: `${23.4 * 2}px`,
            left: `${32.05 * 16}px`,
            width: "31px",
            height: "31px",
            transform: "skewY(5deg)",
            transformOrigin: "top left",
            backgroundColor: "oklch(0.5 0 0 / 0.08)",
          }}
        />
      </div>

      <div className="relative px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          <aside className="hidden lg:sticky lg:top-20 lg:block">
            <ToolDetailSidebar />
          </aside>
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}