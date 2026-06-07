"use client";

import { useState, useEffect } from "react";
import type { ElasticsearchConnection } from "../lib/connection";
import { createClient } from "../lib/elasticsearch-api";
import {
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  ArrowRight,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  connection: ElasticsearchConnection;
}

interface AliasEntry {
  index: string;
  aliases: string[];
}

export function AliasManager({ connection }: Props) {
  const [aliases, setAliases] = useState<AliasEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indices, setIndices] = useState<string[]>([]);

  // Create form
  const [createIndex, setCreateIndex] = useState("");
  const [createAlias, setCreateAlias] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete form
  const [deleteIndex, setDeleteIndex] = useState("");
  const [deleteAlias, setDeleteAlias] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchAliases = async () => {
    setLoading(true);
    setError(null);
    const client = createClient(connection);
    const result = await client.getAliases();
    if (result.success && result.data) {
      const entries: AliasEntry[] = [];
      for (const [index, data] of Object.entries(
        result.data as Record<string, { aliases: Record<string, unknown> }>
      )) {
        const aliasNames = Object.keys(data.aliases || {});
        if (aliasNames.length > 0) {
          entries.push({ index, aliases: aliasNames });
        }
      }
      setAliases(entries);
    } else {
      setError(result.error || "Failed to fetch aliases");
    }
    setLoading(false);
  };

  const fetchIndices = async () => {
    const client = createClient(connection);
    const result = await client.getCatIndices();
    if (result.success && result.data) {
      setIndices(result.data.map((idx) => idx.index));
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      await Promise.all([fetchAliases(), fetchIndices()]);
      if (cancelled) return;
    }
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection.id]);

  const handleCreate = async () => {
    if (!createIndex || !createAlias) return;
    setCreating(true);
    const client = createClient(connection);
    const result = await client.manageAliases([
      { add: { index: createIndex, alias: createAlias } },
    ]);
    if (result.success) {
      setCreateIndex("");
      setCreateAlias("");
      await fetchAliases();
    } else {
      setError(result.error || "Failed to create alias");
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteIndex || !deleteAlias) return;
    setDeleting(true);
    const client = createClient(connection);
    const result = await client.manageAliases([
      { remove: { index: deleteIndex, alias: deleteAlias } },
    ]);
    if (result.success) {
      setDeleteIndex("");
      setDeleteAlias("");
      await fetchAliases();
    } else {
      setError(result.error || "Failed to delete alias");
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Alias Manager</h2>
        <button
          onClick={fetchAliases}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Existing Aliases */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Current Aliases
            </h3>
            {aliases.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No aliases configured.
              </p>
            ) : (
              <div className="space-y-2">
                {aliases.map((entry) => (
                  <div
                    key={entry.index}
                    className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2"
                  >
                    <Tag className="size-3 text-muted-foreground" />
                    <span className="font-mono text-xs text-foreground">
                      {entry.index}
                    </span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    {entry.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="rounded-md bg-[#c5030c]/10 px-2 py-0.5 font-mono text-xs text-[#c5030c]"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Alias */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Create Alias
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Index
                </label>
                <select
                  value={createIndex}
                  onChange={(e) => setCreateIndex(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground"
                >
                  <option value="">Select index...</option>
                  {indices.map((idx) => (
                    <option key={idx} value={idx}>
                      {idx}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Alias Name
                </label>
                <Input
                  value={createAlias}
                  onChange={(e) => setCreateAlias(e.target.value)}
                  placeholder="my-alias"
                  className="h-9 text-xs"
                />
              </div>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!createIndex || !createAlias || creating}
                className="gap-1 bg-[#c5030c] text-white hover:bg-[#a50209]"
              >
                {creating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                Create
              </Button>
            </div>
          </div>

          {/* Delete Alias */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Delete Alias
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Index
                </label>
                <Input
                  value={deleteIndex}
                  onChange={(e) => setDeleteIndex(e.target.value)}
                  placeholder="index-name"
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Alias Name
                </label>
                <Input
                  value={deleteAlias}
                  onChange={(e) => setDeleteAlias(e.target.value)}
                  placeholder="alias-name"
                  className="h-9 text-xs"
                />
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={!deleteIndex || !deleteAlias || deleting}
                className="gap-1"
              >
                {deleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}