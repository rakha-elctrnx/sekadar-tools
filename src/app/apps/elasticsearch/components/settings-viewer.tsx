"use client";

import { useState, useEffect } from "react";
import type { ElasticsearchConnection } from "../lib/connection";
import { createClient } from "../lib/elasticsearch-api";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  connection: ElasticsearchConnection;
}

function SettingsDisplay({
  settings,
  search,
}: {
  settings: Record<string, unknown>;
  search: string;
}) {
  const entries = Object.entries(settings).filter(
    ([key]) =>
      !search ||
      key.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(settings[key])
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No settings match your search.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map(([key, value]) => (
        <SettingsRow key={key} name={key} value={value} depth={0} search={search} />
      ))}
    </div>
  );
}

function SettingsRow({
  name,
  value,
  depth,
  search,
}: {
  name: string;
  value: unknown;
  depth: number;
  search: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    const hasSearchMatch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(value).toLowerCase().includes(search.toLowerCase());

    if (!hasSearchMatch) return null;

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted/50"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <span className="text-muted-foreground">{expanded ? "▼" : "▶"}</span>
          <span className="font-medium text-foreground">{name}</span>
          <span className="text-[10px] text-muted-foreground">
            ({entries.length})
          </span>
        </button>
        {expanded &&
          entries.map(([k, v]) => (
            <SettingsRow
              key={k}
              name={k}
              value={v}
              depth={depth + 1}
              search={search}
            />
          ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-muted/50"
      style={{ paddingLeft: `${depth * 16 + 24}px` }}
    >
      <span className="text-muted-foreground">{name}</span>
      <span className="font-mono text-foreground">
        {value === null || value === undefined ? (
          <span className="italic text-muted-foreground">null</span>
        ) : (
          String(value)
        )}
      </span>
    </div>
  );
}

export function SettingsViewer({ connection }: Props) {
  const [indices, setIndices] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState("");
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchIndices() {
      const client = createClient(connection);
      const result = await client.getCatIndices();
      if (cancelled) return;
      if (result.success && result.data) {
        const names = result.data.map((idx) => idx.index);
        setIndices(names);
        if (names.length > 0) setSelectedIndex(names[0]);
      }
    }
    fetchIndices();
    return () => { cancelled = true; };
  }, [connection.id]);

  useEffect(() => {
    if (!selectedIndex) return;
    let cancelled = false;
    async function fetchSettings() {
      setLoading(true);
      setError(null);
      const client = createClient(connection);
      const result = await client.getSettings(selectedIndex);
      if (cancelled) return;
      if (result.success && result.data) {
        const indexData = (result.data as unknown as Record<string, Record<string, unknown>>)[selectedIndex];
        setSettings((indexData?.settings as Record<string, unknown>) || null);
      } else {
        setError(result.error || "Failed to fetch settings");
      }
      setLoading(false);
    }
    fetchSettings();
    return () => { cancelled = true; };
  }, [connection.id, selectedIndex]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Settings Viewer</h2>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedIndex}
          onChange={(e) => {
            setSelectedIndex(e.target.value);
            setSearch("");
          }}
          className="h-9 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground"
        >
          <option value="">Select index...</option>
          {indices.map((idx) => (
            <option key={idx} value={idx}>
              {idx}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search settings..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && settings && (
        <div className="rounded-xl border border-border/60 bg-card p-2">
          <SettingsDisplay settings={settings} search={search} />
        </div>
      )}

      {!loading && !error && selectedIndex && !settings && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">No settings data found.</p>
        </div>
      )}
    </div>
  );
}