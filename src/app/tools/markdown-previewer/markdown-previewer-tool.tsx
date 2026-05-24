"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToolDetailHeader } from "@/components/tool-detail-header";

const sampleMarkdown = `# Markdown Previewer

Write your markdown on the left, and see the rendered output on the right.

## Features

- Live preview
- Copy markdown source
- Upload and download .md files

### Example Code

\`\`\`ts
function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

> Clean, fast, and fully client-side.

Visit [SekadarTools](https://example.com) to explore more tools.
`;

function sanitizeRenderedHtml(html: string): string {
  if (typeof window === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc
    .querySelectorAll("script, style, iframe, object, embed, link, meta")
    .forEach((node) => node.remove());

  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();

      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }

      if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
        el.removeAttribute(attr.name);
        continue;
      }
    }

    if (el.tagName.toLowerCase() === "a") {
      el.setAttribute("rel", "noopener noreferrer nofollow");
      el.setAttribute("target", "_blank");
    }
  });

  return doc.body.innerHTML;
}

export function MarkdownPreviewerTool() {
  const [markdown, setMarkdown] = useState(sampleMarkdown);
  const [copied, setCopied] = useState(false);


  // Hydration-safe: Only sanitize on client after mount
  const [renderedHtml, setRenderedHtml] = useState<string>("");

  useEffect(() => {
    const source = markdown.trim().length > 0 ? markdown : "_Nothing to preview yet._";
    const parsed = marked.parse(source, {
      breaks: true,
      gfm: true,
    });
    const html = typeof parsed === "string" ? parsed : "";
    // Only sanitize on client
    setRenderedHtml(typeof window === "undefined" ? html : sanitizeRenderedHtml(html));
  }, [markdown]);

  const handleCopyMarkdown = async () => {
    if (!markdown) return;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setMarkdown("");
  };

  const handleLoadSample = () => {
    setMarkdown(sampleMarkdown);
  };

  const handleDownload = () => {
    if (!markdown.trim()) return;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "markdown-preview.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".md,.markdown,.txt";
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = String(evt.target?.result ?? "");
        setMarkdown(text);
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  return (
    <div className="space-y-6">
      <ToolDetailHeader
        title="Markdown Previewer"
        description="Write Markdown and see the rendered output in real-time"
        icon={FileText}
      />

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-card p-3 sm:justify-end">
        <Button
          variant="ghost"
          size="xs"
          onClick={handleLoadSample}
          className="h-6 gap-1 px-1.5 text-xs text-[#c5030c] hover:text-[#c5030c]"
        >
          <Sparkles className="size-3" />
          Load sample
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleFileUpload}
          title="Upload markdown file"
        >
          <Upload className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDownload}
          title="Download markdown"
          disabled={!markdown.trim()}
        >
          <Download className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopyMarkdown}
          title="Copy markdown"
          disabled={!markdown.trim()}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleClear}
          title="Clear markdown"
          disabled={!markdown}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="markdown-input" className="text-sm font-medium">
              Markdown Input
            </Label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {markdown.length.toLocaleString()} chars
            </span>
          </div>
          <Textarea
            id="markdown-input"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Write markdown content here..."
            className="min-h-80 resize-y font-mono text-sm leading-relaxed"
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Live Preview</Label>
          </div>
          <div className="min-h-80 rounded-md border border-border bg-background px-4 py-3">
            <article
              className="text-sm leading-relaxed text-foreground [&_a]:text-[#c5030c] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mt-0 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:my-4 [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
