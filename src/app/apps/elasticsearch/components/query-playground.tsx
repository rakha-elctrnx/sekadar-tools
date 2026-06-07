"use client";

import { useState, useEffect } from "react";
import type { ElasticsearchConnection } from "../lib/connection";
import {
  createClient,
  type SearchResponse,
} from "../lib/elasticsearch-api";
import {
  Play,
  Loader2,
  Clock,
  Copy,
  Check,
  Trash2,
  Save,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  connection: ElasticsearchConnection;
}

interface QueryHistoryEntry {
  id: string;
  index: string;
  query: string;
  timestamp: number;
  duration?: number;
}

const DEFAULT_QUERY = `{
  "query": {
    "match_all": {}
  },
  "size": 10
}`;

function getHistory(): QueryHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("es-query-history") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entry: QueryHistoryEntry) {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(
    "es-query-history",
    JSON.stringify(history.slice(0, 50))
  );
}

function getSavedQueries(): { name: string; query: string }[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("es-saved-queries") || "[]");
  } catch {
    return [];
  }
}

function persistSavedQueries(queries: { name: string; query: string }[]) {
  localStorage.setItem("es-saved-queries", JSON.stringify(queries));
}

export function QueryPlayground({ connection }: Props) {
  const [indices, setIndices] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState("*");
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [saveName, setSaveName] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"editor" | "history" | "saved">("editor");

  // Initialize from localStorage
  const [history] = useState<QueryHistoryEntry[]>(() => getHistory());
  const [savedQueries, setSavedQueries] = useState<{ name: string; query: string }[]>(() => getSavedQueries());

  useEffect(() => {
    let cancelled = false;
    async function fetchIndices() {
      const client = createClient(connection);
      const result = await client.getCatIndices();
      if (cancelled) return;
      if (result.success && result.data) {
        setIndices(result.data.map((idx) => idx.index));
      }
    }
    fetchIndices();
    return () => { cancelled = true; };
  }, [connection.id]);

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setDuration(null);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(query);
    } catch {
      setError("Invalid JSON query");
      setLoading(false);
      return;
    }

    const client = createClient(connection);
    const result = await client.search(selectedIndex, parsed as unknown as Parameters<typeof client.search>[1]);
    setDuration(result.duration || 0);

    if (result.success && result.data) {
      setResult(result.data as SearchResponse);
      const entry: QueryHistoryEntry = {
        id: crypto.randomUUID(),
        index: selectedIndex,
        query,
        timestamp: Date.now(),
        duration: result.duration,
      };
      saveHistory(entry);
    } else {
      setError(result.error || "Query failed");
      setResult(null);
    }
    setLoading(false);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(query);
      setQuery(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveQuery = () => {
    if (!saveName.trim()) return;
    const updated = [...savedQueries, { name: saveName, query }];
    setSavedQueries(updated);
    persistSavedQueries(updated);
    setSaveName("");
  };

  const handleDeleteSaved = (index: number) => {
    const updated = savedQueries.filter((_, i) => i !== index);
    setSavedQueries(updated);
    persistSavedQueries(updated);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Query DSL Playground</h2>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(e.target.value)}
          className="h-9 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground"
        >
          <option value="*">All indices (*)</option>
          {indices.map((idx) => (
            <option key={idx} value={idx}>
              {idx}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleExecute}
            disabled={loading}
            className="gap-1 bg-[#c5030c] text-white hover:bg-[#a50209]"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Run
          </Button>
          <Button size="sm" variant="outline" onClick={handleFormat}>
            Format
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
        {(["editor", "history", "saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "editor" && (
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-64 w-full resize-none rounded-xl border border-border/60 bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-[#c5030c]/30"
        />
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {history.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No query history yet.</p>
          )}
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => {
                setQuery(entry.query);
                setSelectedIndex(entry.index);
                setTab("editor");
              }}
              className="w-full rounded-xl border border-border/60 bg-card p-3 text-left transition-colors hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <code className="text-xs text-foreground">{entry.index}</code>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {entry.duration != null && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="size-2.5" />
                      {entry.duration.toFixed(0)}ms
                    </span>
                  )}
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <pre className="mt-1 line-clamp-2 font-mono text-[10px] text-muted-foreground">
                {entry.query.slice(0, 200)}
              </pre>
            </button>
          ))}
        </div>
      )}

      {tab === "saved" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Query name..."
              className="h-9 flex-1 text-xs"
            />
            <Button
              size="sm"
              onClick={handleSaveQuery}
              disabled={!saveName.trim()}
              className="gap-1"
            >
              <Save className="size-3.5" />
              Save
            </Button>
          </div>
          {savedQueries.map((sq, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-card p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{sq.name}</span>
                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      setQuery(sq.query);
                      setTab("editor");
                    }}
                  >
                    <RotateCcw className="size-3" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleDeleteSaved(i)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
              <pre className="mt-1 line-clamp-2 font-mono text-[10px] text-muted-foreground">
                {sq.query.slice(0, 200)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                {typeof result.hits.total === "object"
                  ? result.hits.total.value
                  : result.hits.total}{" "}
                hits
              </span>
              {duration != null && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {duration.toFixed(1)}ms
                </span>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={handleCopy} className="gap-1 text-xs">
              {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
              Copy
            </Button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-xl border border-border/60 bg-muted/30 p-4 font-mono text-[11px] leading-relaxed text-foreground">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}