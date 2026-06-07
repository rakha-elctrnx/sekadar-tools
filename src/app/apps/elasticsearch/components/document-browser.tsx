"use client";

import { useState, useEffect } from "react";
import type { ElasticsearchConnection } from "../lib/connection";
import {
  createClient,
  type SearchHit,
  type SearchResponse,
} from "../lib/elasticsearch-api";
import {
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Edit3,
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronRight as ChevronExpand,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  connection: ElasticsearchConnection;
}

const PAGE_SIZE = 20;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (value === null) {
    return <span className="text-muted-foreground italic">null</span>;
  }
  if (value === undefined) {
    return <span className="text-muted-foreground italic">undefined</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-purple-500">{String(value)}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-blue-500">{value}</span>;
  }
  if (typeof value === "string") {
    return <span className="text-green-500">{`"${value}"`}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span>[]</span>;
    if (!expanded) {
      return (
        <span
          className="cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(true)}
        >
          [{` `}...{` `}]
        </span>
      );
    }
    return (
      <span>
        <span
          className="cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(false)}
        >
          ▼
        </span>
        {"[\n"}
        {value.map((item, i) => (
          <div key={i} className="pl-4">
            <JsonValue value={item} depth={depth + 1} />
            {i < value.length - 1 ? "," : ""}
          </div>
        ))}
        {"\n]"}
      </span>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span>{"{}"}</span>;
    if (!expanded) {
      return (
        <span
          className="cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(true)}
        >
          {"{ ... }"}
        </span>
      );
    }
    return (
      <span>
        <span
          className="cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(false)}
        >
          ▼
        </span>
        {"{\n"}
        {entries.map(([k, v], i) => (
          <div key={k} className="pl-4">
            <span className="text-blue-400">{`"${k}"`}</span>:{" "}
            <JsonValue value={v} depth={depth + 1} />
            {i < entries.length - 1 ? "," : ""}
          </div>
        ))}
        {"\n}"}
      </span>
    );
  }
  return <span>{String(value)}</span>;
}

function DocumentModal({
  mode,
  index,
  doc,
  connection,
  onClose,
  onSave,
}: {
  mode: "view" | "edit" | "create";
  index: string;
  doc: SearchHit | null;
  connection: ElasticsearchConnection;
  onClose: () => void;
  onSave: () => void;
}) {
  const [id, setId] = useState(doc?._id || "");
  const [body, setBody] = useState(
    doc ? JSON.stringify(doc._source, null, 2) : "{\n  \n}"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const client = createClient(connection);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(body);
    } catch {
      setError("Invalid JSON");
      setSaving(false);
      return;
    }

    if (mode === "create") {
      const result = await client.indexDocument(index, id || undefined, parsed);
      if (!result.success) setError(result.error || "Failed to create");
      else onSave();
    } else if (mode === "edit" && doc) {
      const result = await client.indexDocument(index, doc._id, parsed);
      if (!result.success) setError(result.error || "Failed to update");
      else onSave();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!doc) return;
    if (!confirm("Delete this document?")) return;
    setSaving(true);
    const client = createClient(connection);
    const result = await client.deleteDocument(index, doc._id);
    if (!result.success) {
      setError(result.error || "Failed to delete");
      setSaving(false);
    } else {
      onSave();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isReadOnly = mode === "view";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-border/60 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {mode === "create"
              ? "Create Document"
              : mode === "edit"
                ? `Edit Document: ${doc?._id}`
                : `Document: ${doc?._id}`}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {mode === "create" && (
            <div className="mb-3">
              <label className="mb-1 block text-xs text-muted-foreground">
                Document ID (optional)
              </label>
              <Input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Auto-generated if empty"
                className="h-9 font-mono text-xs"
              />
            </div>
          )}

          {doc && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">_id:</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">
                {doc._id}
              </code>
              <button
                onClick={() => handleCopy(doc._id)}
                className="text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
              </button>
              <span className="text-xs text-muted-foreground">
                _index: {doc._index} | _score: {doc._score}
              </span>
            </div>
          )}

          {mode === "view" && doc ? (
            <div className="overflow-auto rounded-lg bg-muted/30 p-4 font-mono text-xs leading-relaxed">
              <JsonValue value={doc._source} />
            </div>
          ) : (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              readOnly={isReadOnly}
              className="h-80 w-full resize-none rounded-lg border border-border/60 bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-[#c5030c]/30"
              placeholder="{}"
            />
          )}

          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
          <div>
            {mode === "view" && doc && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Switch to edit mode by closing and reopening would be complex,
                    // so we handle inline
                  }}
                  className="gap-1 text-xs"
                >
                  <Edit3 className="size-3" />
                  Edit (use Edit button)
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {mode === "view" && doc && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
                className="gap-1 text-xs"
              >
                <Trash2 className="size-3" />
                Delete
              </Button>
            )}
            {!isReadOnly && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-1 bg-[#c5030c] text-white hover:bg-[#a50209]"
              >
                {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                {mode === "create" ? "Create" : "Save"}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentBrowser({ connection }: Props) {
  const [indices, setIndices] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>(
    () =>
      (window as unknown as { _esSelectedIndex?: string })._esSelectedIndex ||
      ""
  );
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<{
    mode: "view" | "edit" | "create";
    doc: SearchHit | null;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch available indices
  useEffect(() => {
    let cancelled = false;
    async function fetchIndices() {
      const client = createClient(connection);
      const result = await client.getCatIndices();
      if (cancelled) return;
      if (result.success && result.data) {
        const names = result.data.map((idx) => idx.index);
        setIndices(names);
        if (!selectedIndex && names.length > 0) {
          setSelectedIndex(names[0]);
        }
      }
    }
    fetchIndices();
    return () => { cancelled = true; };
  }, [connection.id, selectedIndex]);

  // Fetch documents
  useEffect(() => {
    if (!selectedIndex) return;
    let cancelled = false;
    async function fetchDocs() {
      setLoading(true);
      setError(null);
      const client = createClient(connection);
      const query = searchQuery.trim()
        ? { query_string: { query: searchQuery } }
        : { match_all: {} };
      const result = await client.search(selectedIndex, {
        query,
        size: PAGE_SIZE,
        from: page * PAGE_SIZE,
        sort: [{ _score: { order: "desc" } }, { _id: { order: "asc" } }],
      });
      if (cancelled) return;
      if (result.success && result.data) {
        const data = result.data as SearchResponse;
        setHits(data.hits.hits);
        setTotal(
          typeof data.hits.total === "object"
            ? data.hits.total.value
            : (data.hits.total as number) || 0
        );
      } else {
        setError(result.error || "Failed to search");
      }
      setLoading(false);
    }
    fetchDocs();
    return () => { cancelled = true; };
  }, [connection.id, selectedIndex, searchQuery, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSave = () => {
    setModal(null);
    setPage(0);
    // Re-fetch by toggling a refresh
    setSearchQuery((q) => q + " ");
    setTimeout(() => setSearchQuery((q) => q.trim()), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Documents</h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedIndex}
          onChange={(e) => {
            setSelectedIndex(e.target.value);
            setPage(0);
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
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search (Query DSL syntax)..."
            className="h-9 pl-9 font-mono text-xs"
          />
        </div>

        <Button
          size="sm"
          onClick={() => setModal({ mode: "create", doc: null })}
          disabled={!selectedIndex}
          className="gap-1 bg-[#c5030c] text-white hover:bg-[#a50209]"
        >
          <Plus className="size-3.5" />
          Create
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && selectedIndex && (
        <>
          <div className="text-xs text-muted-foreground">
            {total.toLocaleString()} document{total !== 1 ? "s" : ""} found
          </div>

          <div className="space-y-2">
            {hits.map((hit) => (
              <div
                key={hit._id}
                className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                      {hit._id}
                    </code>
                    <button
                      onClick={() => handleCopyId(hit._id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === hit._id ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      _score: {hit._score}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        setModal({ mode: "view", doc: hit })
                      }
                    >
                      <ChevronExpand className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        setModal({ mode: "edit", doc: hit })
                      }
                    >
                      <Edit3 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="overflow-auto rounded-lg bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">
                  <JsonValue value={hit._source} depth={1} />
                </div>
              </div>
            ))}
          </div>

          {hits.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
              <p className="text-sm text-muted-foreground">No documents found.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedIndex && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Select an index to browse documents.
          </p>
        </div>
      )}

      {modal && (
        <DocumentModal
          mode={modal.mode}
          index={selectedIndex}
          doc={modal.doc}
          connection={connection}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}