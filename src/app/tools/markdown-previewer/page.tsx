import type { Metadata } from "next";
import { MarkdownPreviewerTool } from "./markdown-previewer-tool";

export const metadata: Metadata = {
  title: "Markdown Previewer",
  description:
    "Write Markdown and preview rendered output in real-time. Fast, free, and runs entirely in your browser.",
};

export default function MarkdownPreviewerPage() {
  return <MarkdownPreviewerTool />;
}
