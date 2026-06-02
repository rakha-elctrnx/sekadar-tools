"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Copy,
  Check,
  RefreshCw,
  Globe,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToolDetailHeader } from "@/components/tool-detail-header";

// ── UUID generators ────────────────────────────────────────────────

function hexBytes(n: number): string {
  return [...crypto.getRandomValues(new Uint8Array(n))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateV1(): string {
  const now = Date.now();
  const gregorianMs = now + 12219292800000;
  const highMs = Math.floor(gregorianMs / 0x100000000);
  const lowMs = gregorianMs & 0xffffffff;
  const lowTicks = (lowMs * 10000) & 0xffffffff;
  const carry = Math.floor((lowMs * 10000) / 0x100000000);
  const midHiTicks = (highMs * 10000) + carry;

  const low = lowTicks;
  const mid = midHiTicks & 0xffff;
  const hi = (Math.floor(midHiTicks / 0x10000) & 0x0fff) | 0x1000;
  const clockSeq = (parseInt(hexBytes(2), 16) & 0x3fff) | 0x8000;
  const node = hexBytes(6);

  return [
    low.toString(16).padStart(8, "0"),
    mid.toString(16).padStart(4, "0"),
    hi.toString(16).padStart(4, "0"),
    clockSeq.toString(16).padStart(4, "0"),
    node,
  ].join("-");
}

function generateV4(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function generateV7(): string {
  const ms = Date.now();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[0] = Math.floor(ms / 0x10000000000) & 0xff;
  b[1] = Math.floor(ms / 0x100000000) & 0xff;
  b[2] = Math.floor(ms / 0x1000000) & 0xff;
  b[3] = Math.floor(ms / 0x10000) & 0xff;
  b[4] = Math.floor(ms / 0x100) & 0xff;
  b[5] = ms & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function generateNil(): string {
  return "00000000-0000-0000-0000-000000000000";
}

// ── Types & config ────────────────────────────────────────────────

type UUIDVersion = "v1" | "v4" | "v7" | "nil";

interface VersionConfig {
  label: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  description: string;
  fields: { label: string; value: string }[];
  generate: () => string;
}

const versions: Record<UUIDVersion, VersionConfig> = {
  v1: {
    label: "UUID v1",
    subtitle: "Time-based",
    badge: "Version 1",
    badgeClass: "bg-red-50 text-[#c5030c] border-red-100 dark:bg-red-950/30 dark:text-red-400",
    description: "UUID v1 encodes the current timestamp (100-nanosecond intervals since Oct 15, 1582) plus a clock sequence and simulated MAC node.",
    fields: [
      { label: "Based on", value: "Timestamp + node" },
      { label: "Uniqueness", value: "Time + randomness" },
      { label: "Sortable", value: "Partial" },
      { label: "Standard", value: "RFC 4122" }
    ],
    generate: generateV1,
  },
  v4: {
    label: "UUID v4",
    subtitle: "Random",
    badge: "Version 4",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400",
    description: "UUID v4 is 122 bits of cryptographically random data. No time or identity info is embedded.",
    fields: [
      { label: "Based on", value: "Random bits" },
      { label: "Uniqueness", value: "Statistical" },
      { label: "Sortable", value: "No" },
      { label: "Standard", value: "RFC 4122" }
    ],
    generate: generateV4,
  },
  v7: {
    label: "UUID v7",
    subtitle: "Unix time",
    badge: "Version 7",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400",
    description: "UUID v7 uses a Unix millisecond timestamp as the most-significant 48 bits, making UUIDs lexicographically sortable.",
    fields: [
      { label: "Based on", value: "Unix ms timestamp" },
      { label: "Uniqueness", value: "Time + 74 random bits" },
      { label: "Sortable", value: "Yes — naturally" },
      { label: "Standard", value: "RFC 9562" }
    ],
    generate: generateV7,
  },
  nil: {
    label: "Nil UUID",
    subtitle: "Empty",
    badge: "Nil / Empty",
    badgeClass: "bg-muted text-muted-foreground border-border",
    description: "The Nil UUID is a special-case UUID where all 128 bits are zero. Used as a sentinel or null value.",
    fields: [
      { label: "Value", value: "All zeros" },
      { label: "Purpose", value: "Null / sentinel" },
      { label: "Unique?", value: "No" },
      { label: "Standard", value: "RFC 4122" }
    ],
    generate: generateNil,
  },
};

const VERSION_KEYS: UUIDVersion[] = ["v1", "v4", "v7", "nil"];

export default function UUIDGeneratorTool() {
  const [activeVersion, setActiveVersion] = useState<UUIDVersion>("v4");
  const [uuid, setUuid] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkList, setBulkList] = useState<string[]>([]);
  const [copiedBulkIndex, setCopiedBulkIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const config = versions[activeVersion];

  // Generate UUID after mount (like password generator)
  useEffect(() => {
    setUuid(versions[activeVersion].generate());
  }, [activeVersion]);

  const handleSelectVersion = useCallback((v: UUIDVersion) => {
    setActiveVersion(v);
    setCopied(false);
    setBulkList([]);
    setCopiedBulkIndex(null);
    setCopiedAll(false);
  }, []);

  const handleRegenerate = useCallback(() => {
    setUuid(versions[activeVersion].generate());
    setCopied(false);
  }, [activeVersion]);

  const handleCopy = useCallback(async () => {
    if (!uuid) return;
    try {
      await navigator.clipboard.writeText(uuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = uuid;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [uuid]);

  const handleGenerateBulk = useCallback(() => {
    const list = Array.from({ length: bulkCount }, () =>
      versions[activeVersion].generate()
    );
    setBulkList(list);
    setCopiedBulkIndex(null);
    setCopiedAll(false);
  }, [activeVersion, bulkCount]);

  const handleCopyBulkItem = useCallback(async (val: string, index: number) => {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      setCopiedBulkIndex(index);
      setTimeout(() => setCopiedBulkIndex(null), 1500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = val;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedBulkIndex(index);
      setTimeout(() => setCopiedBulkIndex(null), 1500);
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    if (!bulkList.length) return;
    const text = bulkList.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  }, [bulkList]);

  return (



    <div className="space-y-6">
      <ToolDetailHeader
        title="UUID Generator"
        description="Generate universally unique identifiers — v1, v4, v7, and Nil"
        icon={Globe}
      />

      {/* Version Tabs - Always render buttons, server and client same */}
      <div className="flex flex-wrap gap-2">
        {VERSION_KEYS.map((v) => (
          <button
            key={v}
            onClick={() => handleSelectVersion(v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${activeVersion === v
              ? "border-[#c5030c]/30 bg-[#c5030c]/5 text-[#c5030c] dark:border-[#c5030c]/40 dark:bg-[#c5030c]/10"
              : "border-border/60 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
          >
            {versions[v].label}
            <span className="text-[11px] opacity-60">{versions[v].subtitle}</span>
          </button>
        ))}
      </div>

      {/* Main Display */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.badgeClass}`}>
              {config.badge}
            </span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleRegenerate}
            className="h-7 gap-1.5 px-2 text-xs text-[#c5030c] hover:text-[#c5030c]"
          >
            <RefreshCw className="size-3" />
            Regenerate
          </Button>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-4">
          <span className="flex-1 select-all break-all font-mono text-base font-semibold tracking-wide sm:text-lg">
            {uuid || "—"}
          </span>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleCopy}
            disabled={!uuid}
            title={copied ? "Copied!" : "Copy UUID"}
            className="shrink-0"
          >
            {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Bulk Generator */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Bulk Generate</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="bulk-count" className="text-sm font-medium">Number of UUIDs</Label>
            <Badge variant="secondary" className="font-mono text-xs tabular-nums">
              {bulkCount}
            </Badge>
          </div>
          <input
            id="bulk-count"
            type="range"
            min={1}
            max={20}
            value={bulkCount}
            onChange={(e) => setBulkCount(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#c5030c] [&::-webkit-slider-thumb]:shadow-sm"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateBulk}
            className="gap-1.5 text-xs"
          >
            <List className="size-3.5" />
            Generate {bulkCount} UUIDs
          </Button>
          {bulkList.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAll}
              className="text-xs font-medium text-[#c5030c] hover:text-[#c5030c]"
            >
              {copiedAll ? "✓ Copied!" : "Copy all"}
            </Button>
          )}
        </div>

        {bulkList.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-medium text-muted-foreground">Generated UUIDs</span>
              <span className="text-xs text-muted-foreground">{bulkList.length} items</span>
            </div>
            <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {bulkList.map((id, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <span className="flex-1 select-all font-mono text-[12px] text-muted-foreground break-all">
                    {id}
                  </span>
                  <button
                    onClick={() => handleCopyBulkItem(id, i)}
                    className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
                    title="Copy UUID"
                  >
                    {copiedBulkIndex === i ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">About {config.badge}</h2>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {config.description}
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {config.fields.map((f) => (
            <div
              key={f.label}
              className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2.5 space-y-1"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {f.label}
              </p>
              <p className="text-xs font-semibold text-foreground">
                {f.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/50">
          <Badge variant="secondary" className="text-[11px] font-normal">
            RFC 4122
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-normal">
            RFC 9562
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-normal">
            Web Crypto API
          </Badge>
          <Badge variant="secondary" className="text-[11px] font-normal">
            Client-side Only
          </Badge>
        </div>
      </div>
    </div>
  );
}