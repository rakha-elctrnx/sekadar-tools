"use client";

import { useState, useCallback } from "react";
import {
  ArrowRightLeft,
  Copy,
  Check,
  Sparkles,
  Trash2,
  FileCode2,
  Download,
  Upload,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolDetailHeader } from "@/components/tool-detail-header";

type Mode = "encode" | "decode";

export function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState({ input: 0, output: 0 });

  const encode = useCallback((text: string): string => {
    // Handle UTF-8 encoding properly
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }, []);

  const decode = useCallback((base64: string): string => {
    // Remove whitespace/newlines from input
    const cleaned = base64.replace(/\s/g, "");
    const binary = atob(cleaned);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return decoder.decode(bytes);
  }, []);

  const handleTransform = useCallback(
    (value: string, currentMode: Mode) => {
      setInput(value);
      setCharCount((prev) => ({ ...prev, input: value.length }));
      setError("");

      if (!value.trim()) {
        setOutput("");
        setCharCount((prev) => ({ ...prev, output: 0 }));
        return;
      }

      try {
        const result =
          currentMode === "encode" ? encode(value) : decode(value);
        setOutput(result);
        setCharCount((prev) => ({ ...prev, output: result.length }));
      } catch (e) {
        const message =
          currentMode === "decode"
            ? "Invalid Base64 string. Please check your input."
            : "Could not encode the provided text.";
        setError(message);
        setOutput("");
        setCharCount((prev) => ({ ...prev, output: 0 }));
      }
    },
    [encode, decode]
  );

  const handleInputChange = (value: string) => {
    handleTransform(value, mode);
  };

  const handleModeChange = (newMode: string) => {
    const m = newMode as Mode;
    setMode(m);
    setError("");
    // Re-transform existing input with new mode
    if (input.trim()) {
      handleTransform(input, m);
    }
  };

  const handleSwap = () => {
    const newMode: Mode = mode === "encode" ? "decode" : "encode";
    setMode(newMode);
    setInput(output);
    setError("");
    if (output.trim()) {
      handleTransform(output, newMode);
    } else {
      setOutput("");
      setCharCount({ input: 0, output: 0 });
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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
    setCharCount({ input: 0, output: 0 });
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `base64-${mode}d.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".txt,.text,.csv,.json,.xml,.html,.css,.js,.ts,.md";
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        handleTransform(text, mode);
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  const sampleText =
    mode === "encode"
      ? "Hello, World! 🚀 SekadarTools is awesome."
      : "SGVsbG8sIFdvcmxkISDwn5qAIFF1aWNrVXRpbHMgaXMgYXdlc29tZS4=";

  const handleLoadSample = () => {
    handleTransform(sampleText, mode);
  };

  return (
    <div className="space-y-6">
      <ToolDetailHeader
        title="Base64 Encode / Decode"
        description="Convert text to Base64 and back with full UTF-8 support"
        icon={FileCode2}
      />

      {/* Mode Tabs + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="h-9">
            <TabsTrigger value="encode" className="text-xs sm:text-sm">
              Encode
            </TabsTrigger>
            <TabsTrigger value="decode" className="text-xs sm:text-sm">
              Decode
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1.5">
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
            title="Upload file"
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
        {/* Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="base64-input" className="text-sm font-medium">
              {mode === "encode" ? "Plain Text" : "Base64 Input"}
            </Label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {charCount.input.toLocaleString()} chars
            </span>
          </div>
          <Textarea
            id="base64-input"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={
              mode === "encode"
                ? "Enter text to encode to Base64..."
                : "Paste Base64 string to decode..."
            }
            className="min-h-[240px] resize-y font-mono text-sm leading-relaxed placeholder:font-sans sm:min-h-[320px]"
            spellCheck={false}
          />
        </div>

        {/* Swap Button (centered between panels) */}
        <div className="flex items-center justify-center lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwap}
            className="gap-1.5"
            disabled={!output}
          >
            <ArrowRightLeft className="size-3.5" />
            Swap
          </Button>
        </div>

        {/* Output */}
        <div className="relative space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="base64-output" className="text-sm font-medium">
              {mode === "encode" ? "Base64 Output" : "Decoded Text"}
            </Label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {charCount.output.toLocaleString()} chars
            </span>
          </div>
          <div className="relative">
            <Textarea
              id="base64-output"
              value={error ? "" : output}
              readOnly
              placeholder={
                error
                  ? ""
                  : mode === "encode"
                  ? "Base64 encoded output will appear here..."
                  : "Decoded text will appear here..."
              }
              className="min-h-[240px] resize-y font-mono text-sm leading-relaxed bg-muted/30 sm:min-h-[320px]"
              spellCheck={false}
            />

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <AlertCircle className="size-8 text-destructive/70" />
                  <p className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons overlay */}
            {output && !error && (
              <div className="absolute right-3 top-3 flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="icon-xs"
                  onClick={handleCopy}
                  title={copied ? "Copied!" : "Copy output"}
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="icon-xs"
                  onClick={handleDownload}
                  title="Download output"
                >
                  <Download className="size-3" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon-xs"
                  onClick={handleSwap}
                  title="Swap input ↔ output"
                >
                  <ArrowRightLeft className="size-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold">About Base64</h2>
        <div className="grid gap-4 text-[13px] leading-relaxed text-muted-foreground sm:grid-cols-2">
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">What is Base64?</strong>{" "}
              Base64 is a binary-to-text encoding scheme that represents binary
              data as an ASCII string. It&apos;s commonly used for encoding data
              in URLs, emails, and embedding binary data in text-based formats
              like JSON or XML.
            </p>
            <p>
              <strong className="text-foreground">Character Set:</strong> Uses
              A–Z, a–z, 0–9, +, and / (64 characters), with = for padding.
            </p>
          </div>
          <div className="space-y-2">
            <p>
              <strong className="text-foreground">Common Uses:</strong> Email
              attachments (MIME), data URIs in HTML/CSS, API authentication
              tokens, storing binary in JSON, and JWT tokens.
            </p>
            <p>
              <strong className="text-foreground">Size Impact:</strong> Base64
              encoding increases data size by approximately 33% (every 3 bytes
              of input becomes 4 bytes of output).
            </p>
          </div>
        </div>

        {/* Quick reference */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-[11px] font-normal">
            RFC 4648
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-normal">
            UTF-8 Safe
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-normal">
            +33% Size
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-normal">
            Client-side Only
          </Badge>
        </div>
      </div>
    </div>
  );
}
