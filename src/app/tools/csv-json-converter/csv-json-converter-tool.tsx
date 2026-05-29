"use client";

import { useState, useCallback } from "react";
import {
  Copy,
  Check,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  ArrowRightLeft,
  Sparkles,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import Editor from "@monaco-editor/react";
import { ToolDetailHeader } from "@/components/tool-detail-header";

type ConversionMode = "csv-to-json" | "json-to-csv";
type DelimiterType = "," | ";" | "\t" | "|";

function parseCsv(csv: string, delimiter: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    if (lines.length === 1) {
      throw new Error("CSV must have at least a header row and one data row.");
    }
    throw new Error("Input is empty or has no data rows.");
  }

  const parseRow = (row: string, delim: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < row.length && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delim) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0], delimiter);
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    data.push(row);
  }

  return data;
}

function jsonToCsv(json: Record<string, unknown>[], delimiter: string): string {
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error("JSON must be a non-empty array of objects.");
  }

  const firstItem = json[0];
  if (typeof firstItem !== "object" || firstItem === null || Array.isArray(firstItem)) {
    throw new Error("Each item in the JSON array must be a flat object.");
  }

  const headers = Object.keys(firstItem);

  const escapeField = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = json.map((item) =>
    headers.map((header) => escapeField(item[header])).join(delimiter)
  );

  return [headers.join(delimiter), ...rows].join("\n");
}

export function CsvJsonConverterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<ConversionMode>("csv-to-json");
  const [delimiter, setDelimiter] = useState<DelimiterType>(",");
  const [rowCount, setRowCount] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();

  const handleConvert = useCallback(
    (value: string, conversionMode: ConversionMode = mode, delim: DelimiterType = delimiter) => {
      setError("");
      setRowCount(null);

      if (!value.trim()) {
        setOutput("");
        return;
      }

      try {
        if (conversionMode === "csv-to-json") {
          const result = parseCsv(value, delim);
          setRowCount(result.length);
          setOutput(JSON.stringify(result, null, 2));
        } else {
          const parsed = JSON.parse(value);
          const result = jsonToCsv(parsed, delim);
          setRowCount(parsed.length);
          setOutput(result);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Conversion failed.";
        setError(message);
        setOutput("");
        setRowCount(null);
      }
    },
    [mode, delimiter]
  );

  const handleInputChange = (value: string) => {
    setInput(value);
    if (!value.trim()) {
      setOutput("");
      setError("");
      setRowCount(null);
    }
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
    setRowCount(null);
  };

  const handleDownload = () => {
    if (!output) return;
    const isCsv = mode === "json-to-csv";
    const ext = isCsv ? "csv" : "json";
    const mimeType = isCsv ? "text/csv" : "application/json";
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = mode === "csv-to-json" ? ".csv,.tsv,.txt" : ".json,.txt";
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setInput(text);
        handleConvert(text);
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  const handleSwapMode = () => {
    const newMode: ConversionMode = mode === "csv-to-json" ? "json-to-csv" : "csv-to-json";
    setMode(newMode);
    // If there's output, swap it to input
    if (output) {
      setInput(output);
      setOutput("");
      setError("");
      setRowCount(null);
    }
  };

  const sampleCsv = `name,email,age,city
John Doe,john@example.com,30,New York
Jane Smith,jane@example.com,25,San Francisco
Bob Wilson,bob@example.com,35,Chicago`;

  const sampleJson = `[
  { "name": "John Doe", "email": "john@example.com", "age": 30, "city": "New York" },
  { "name": "Jane Smith", "email": "jane@example.com", "age": 25, "city": "San Francisco" },
  { "name": "Bob Wilson", "email": "bob@example.com", "age": 35, "city": "Chicago" }
]`;

  const handleLoadSample = () => {
    const sample = mode === "csv-to-json" ? sampleCsv : sampleJson;
    setInput(sample);
    handleConvert(sample);
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
    tabSize: 2,
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
    },
  };

  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

  const inputLanguage = mode === "csv-to-json" ? "plaintext" : "json";
  const outputLanguage = mode === "csv-to-json" ? "json" : "plaintext";

  return (
    <div className="space-y-6">
      <ToolDetailHeader
        title="CSV ↔ JSON Converter"
        description="Convert between CSV and JSON formats with support for custom delimiters"
        icon={FileSpreadsheet}
      />

      {/* Control bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Mode:</Label>
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
              <button
                onClick={() => {
                  setMode("csv-to-json");
                  setOutput("");
                  setError("");
                  setRowCount(null);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  mode === "csv-to-json"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                CSV → JSON
              </button>
              <button
                onClick={() => {
                  setMode("json-to-csv");
                  setOutput("");
                  setError("");
                  setRowCount(null);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  mode === "json-to-csv"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                JSON → CSV
              </button>
            </div>
          </div>

          {/* Delimiter Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Delimiter:</Label>
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
              {([",", ";", "\t", "|"] as DelimiterType[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDelimiter(d)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    delimiter === d
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d === "," ? "Comma" : d === ";" ? "Semicolon" : d === "\t" ? "Tab" : "Pipe"}
                </button>
              ))}
            </div>
          </div>
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
            title={`Upload ${mode === "csv-to-json" ? "CSV" : "JSON"} file`}
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
            <Label className="text-sm font-medium">
              {mode === "csv-to-json" ? "CSV Input" : "JSON Input"}
            </Label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {input.length.toLocaleString()} chars
            </span>
          </div>
          <div className="h-[360px] overflow-hidden rounded-lg border border-border bg-background">
            <Editor
              height="100%"
              language={inputLanguage}
              theme={monacoTheme}
              value={input}
              onChange={(val) => handleInputChange(val || "")}
              options={editorOptions}
              loading={
                <div className="flex h-full items-center justify-center gap-2 bg-muted/10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-[#c5030c]" />
                  Loading Editor...
                </div>
              }
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleConvert(input)}
              disabled={!input.trim()}
              className="text-xs hover:border-[#c5030c]/30 hover:text-[#c5030c]"
            >
              <ArrowRightLeft className="size-3 mr-1" />
              Convert
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handleSwapMode}
              disabled={!output}
              className="text-xs"
            >
              <ArrowRightLeft className="size-3 mr-1" />
              Swap (use output as input)
            </Button>
          </div>
        </div>

        {/* Output panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">
                {mode === "csv-to-json" ? "JSON Output" : "CSV Output"}
              </Label>
              {rowCount !== null && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] px-1.5 py-0"
                >
                  {rowCount} {rowCount === 1 ? "row" : "rows"}
                </Badge>
              )}
            </div>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {output.length.toLocaleString()} chars
            </span>
          </div>

          <div className="relative h-[360px] overflow-hidden rounded-lg border border-border bg-background">
            <Editor
              height="100%"
              language={outputLanguage}
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
                  Loading Editor...
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
                  title={`Download ${mode === "csv-to-json" ? "JSON" : "CSV"} file`}
                  className="hover:bg-muted"
                >
                  <Download className="size-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="size-4.5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider">
                  Conversion Error
                </h4>
                <p className="text-xs text-muted-foreground font-mono leading-normal whitespace-pre-wrap">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">About CSV ↔ JSON Conversion</h2>
        <div className="grid gap-4 text-[13px] leading-relaxed text-muted-foreground sm:grid-cols-2">
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">CSV to JSON:</strong>{" "}
              Converts tabular CSV data into a JSON array of objects. The first row is used as
              headers (keys), and each subsequent row becomes an object in the array.
            </p>
            <p>
              <strong className="text-foreground">JSON to CSV:</strong>{" "}
              Converts a JSON array of flat objects into CSV format. Object keys become column
              headers, and values are properly escaped with quotes when needed.
            </p>
          </div>
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">Delimiter Support:</strong>{" "}
              Choose between comma, semicolon, tab, or pipe delimiters. This is useful for
              regional CSV formats (e.g., European CSVs often use semicolons).
            </p>
            <p>
              <strong className="text-foreground">Security &amp; Privacy:</strong>{" "}
              All conversions happen entirely in your browser. No data is sent to any server.
              Your data stays on your machine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
