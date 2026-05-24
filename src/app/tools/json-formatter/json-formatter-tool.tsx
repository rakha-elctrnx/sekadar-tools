"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Copy,
  Check,
  Trash2,
  Braces,
  Download,
  Upload,
  AlertCircle,
  Minimize2,
  Maximize2,
  Code,
  FileJson,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import Editor from "@monaco-editor/react";
import { ToolDetailHeader } from "@/components/tool-detail-header";

type IndentType = "2" | "4" | "tab";

export function JSONFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [indent, setIndent] = useState<IndentType>("2");
  const [autoFormat, setAutoFormat] = useState(true);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [charCount, setCharCount] = useState({ input: 0, output: 0 });
  const { resolvedTheme } = useTheme();

  const getIndentValue = (type: IndentType) => {
    if (type === "2") return 2;
    if (type === "4") return 4;
    return "\t";
  };

  const handleTransform = useCallback(
    (value: string, operation: "beautify" | "minify" | "escape" | "unescape", indentType: IndentType = indent) => {
      setError("");
      setIsValid(null);

      if (!value.trim()) {
        setOutput("");
        setIsValid(null);
        setCharCount((prev) => ({ ...prev, output: 0 }));
        return;
      }

      try {
        let result = "";
        if (operation === "escape") {
          JSON.parse(value);
          result = JSON.stringify(value);
          setIsValid(true);
        } else if (operation === "unescape") {
          let parsedStr = value.trim();
          if (!parsedStr.startsWith('"')) {
            parsedStr = `"${parsedStr}"`;
          }
          const unescaped = JSON.parse(parsedStr);
          JSON.parse(unescaped);
          result = unescaped;
          setIsValid(true);
        } else {
          const parsed = JSON.parse(value);
          setIsValid(true);
          if (operation === "minify") {
            result = JSON.stringify(parsed);
          } else {
            result = JSON.stringify(parsed, null, getIndentValue(indentType));
          }
        }

        setOutput(result);
        setCharCount((prev) => ({ ...prev, output: result.length }));
      } catch (e: any) {
        setIsValid(false);
        setError(e.message || "Invalid JSON syntax.");
        setOutput("");
        setCharCount((prev) => ({ ...prev, output: 0 }));
      }
    },
    [indent]
  );

  // Trigger auto-format on input or indent change
  useEffect(() => {
    if (autoFormat && input.trim()) {
      handleTransform(input, "beautify", indent);
    }
  }, [input, indent, autoFormat, handleTransform]);

  const handleInputChange = (value: string) => {
    setInput(value);
    setCharCount((prev) => ({ ...prev, input: value.length }));
    if (!value.trim()) {
      setOutput("");
      setError("");
      setIsValid(null);
      setCharCount((prev) => ({ ...prev, output: 0 }));
    }
  };

  const handleManualBeautify = () => {
    handleTransform(input, "beautify");
  };

  const handleManualMinify = () => {
    handleTransform(input, "minify");
  };

  const handleEscape = () => {
    handleTransform(input, "escape");
  };

  const handleUnescape = () => {
    handleTransform(input, "unescape");
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = output;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
    setIsValid(null);
    setCharCount({ input: 0, output: 0 });
  };

  const handleDownload = () => {
    if (!output) return;
    const isMinified = !output.includes("\n");
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isMinified ? "minified.json" : "formatted.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,.txt";
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setInput(text);
        setCharCount((prev) => ({ ...prev, input: text.length }));
        handleTransform(text, "beautify");
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  const sampleJSON = `{
  "name": "SekadarTools",
  "version": "1.0.0",
  "description": "Free web-based client-side developer utility tools.",
  "active": true,
  "stats": {
    "downloads": 10240,
    "rating": 4.9
  },
  "tags": [
    "utility",
    "developer",
    "base64",
    "json-formatter"
  ]
}`;

  const handleLoadSample = () => {
    setInput(sampleJSON);
    setCharCount((prev) => ({ ...prev, input: sampleJSON.length }));
    handleTransform(sampleJSON, "beautify");
  };

  const editorOptions = {
    minimap: { enabled: false },
    lineNumbers: "on" as const,
    folding: true,
    fontSize: 13,
    fontFamily: "var(--font-jetbrains-mono), monospace",
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    automaticLayout: true,
    renderLineHighlight: "all" as const,
    tabSize: indent === "tab" ? 4 : parseInt(indent),
    insertSpaces: indent !== "tab",
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
    },
  };

  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

  return (
    <div className="space-y-6">
      <ToolDetailHeader
        title="JSON Formatter"
        description="Format, beautify, minify, validate, and escape JSON data"
        icon={Braces}
      />

      {/* Control bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {/* Indentation Selector */}
          <div className="flex items-center gap-2">
            <Label htmlFor="indent-select" className="text-xs text-muted-foreground whitespace-nowrap">
              Tab size:
            </Label>
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
              {(["2", "4", "tab"] as IndentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setIndent(type)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${indent === type
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {type === "tab" ? "Tabs" : `${type} Spaces`}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Format Toggle */}
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-7 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:bg-zinc-800 peer-checked:bg-[#c5030c]"></div>
            <span className="text-xs text-muted-foreground">Auto-format on type</span>
          </label>
        </div>

        {/* Global Toolbar actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleLoadSample}
            className="text-xs text-[#c5030c] hover:text-[#c5030c] gap-1 h-6 px-1.5"
          >
            <Sparkles className="size-3" />
            Load sample
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleFileUpload}
            title="Upload JSON file"
          >
            <Upload className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            title="Clear all"
            disabled={!input && !output}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">JSON Input</Label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {charCount.input.toLocaleString()} chars
            </span>
          </div>
          <div className="h-[360px] overflow-hidden rounded-lg border border-border bg-background">
            <Editor
              height="100%"
              language="json"
              theme={monacoTheme}
              value={input}
              onChange={(val) => handleInputChange(val || "")}
              options={editorOptions}
              loading={
                <div className="flex h-full items-center justify-center gap-2 bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-[#c5030c]" />
                  Loading Monaco Editor...
                </div>
              }
            />
          </div>

          {/* Action trigger row for manual modes */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button
              variant="outline"
              size="xs"
              onClick={handleManualBeautify}
              disabled={!input.trim()}
              className="text-xs hover:border-[#c5030c]/30 hover:text-[#c5030c]"
            >
              <Maximize2 className="size-3 mr-1" />
              Beautify
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handleManualMinify}
              disabled={!input.trim()}
              className="text-xs hover:border-[#c5030c]/30 hover:text-[#c5030c]"
            >
              <Minimize2 className="size-3 mr-1" />
              Minify
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handleEscape}
              disabled={!input.trim()}
              className="text-xs"
            >
              <Code className="size-3 mr-1" />
              Escape
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handleUnescape}
              disabled={!input.trim()}
              className="text-xs"
            >
              <FileJson className="size-3 mr-1" />
              Unescape
            </Button>
          </div>
        </div>

        {/* Output panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Output</Label>
              {isValid === true && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none flex items-center gap-1 text-[10px] px-1.5 py-0">
                  <CheckCircle2 className="size-3" />
                  Valid JSON
                </Badge>
              )}
              {isValid === false && (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive border-none flex items-center gap-1 text-[10px] px-1.5 py-0">
                  <AlertCircle className="size-3" />
                  Invalid JSON
                </Badge>
              )}
            </div>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {charCount.output.toLocaleString()} chars
            </span>
          </div>

          <div className="relative h-[360px] overflow-hidden rounded-lg border border-border bg-background">
            <Editor
              height="100%"
              language="json"
              theme={monacoTheme}
              value={output}
              options={{
                ...editorOptions,
                readOnly: true,
                domReadOnly: true,
              }}
              loading={
                <div className="flex h-full items-center justify-center gap-2 bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-[#c5030c]" />
                  Loading Monaco Editor...
                </div>
              }
            />

            {/* Float actions on output container */}
            {output && (
              <div className="absolute right-6 top-3 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur p-1 rounded-lg border shadow-sm">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopy}
                  title={copied ? "Copied!" : "Copy output"}
                  className="hover:bg-muted"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleDownload}
                  title="Download JSON file"
                  className="hover:bg-muted"
                >
                  <Download className="size-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Validation/Error details display below */}
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="size-4.5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider">JSON Parse Error</h4>
                <p className="text-xs text-muted-foreground font-mono leading-normal whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">About JSON Formatting</h2>
        <div className="grid gap-4 text-[13px] leading-relaxed text-muted-foreground sm:grid-cols-2">
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">Why Format JSON?</strong>{" "}
              JSON (JavaScript Object Notation) is often sent between servers and web applications in a minified, single-line format to save bandwidth. This tool expands the data back into a readable structure with proper indentation and indentation preferences.
            </p>
            <p>
              <strong className="text-foreground">Real-time Validation:</strong> This formatter checks your JSON validity as you type. If you have mismatched brackets, missing quotes, or misplaced commas, it will highlight exactly where the error is.
            </p>
          </div>
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">Escaped JSON:</strong> Useful when you need to embed a JSON string inside code (like a C# or Java string, or a shell script). It replaces double quotes with `\"` and compresses the content into a valid escaped string.
            </p>
            <p>
              <strong className="text-foreground">Security &amp; Privacy:</strong> All formatting, minification, and conversions happen entirely on your computer inside your browser. No data is sent to our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
