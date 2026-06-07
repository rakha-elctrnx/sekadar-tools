"use client";

import { useState, useEffect, useMemo } from "react";
import type { ElasticsearchConnection } from "../lib/connection";
import { createClient, type CatShard } from "../lib/elasticsearch-api";
import { Search, RefreshCw, Loader2, Grid3X3 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  connection: ElasticsearchConnection;
}

export function ShardViewer({ connection }: Props) {
  const [shards, setShards] = useState<CatShard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [nodeFilter, setNodeFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      const client = createClient(connection);
      const result = await client.getCatShards();
      if (cancelled) return;
      if (result.success) {
        setShards(result.data || []);
      } else {
        setError(result.error || "Failed to fetch shards");
      }
      setLoading(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, [connection.id]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    const client = createClient(connection);
    const result = await client.getCatShards();
    if (result.success) {
      setShards(result.data || []);
    } else {
      setError(result.error || "Failed to fetch shards");
    }
    setLoading(false);
  };

  const nodes = useMemo(
    () => [...new Set(shards.map((s) => s.node))].sort(),
    [shards]
  );

  const filtered = useMemo(() => {
    let result = shards;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.index.toLowerCase().includes(q) ||
          s.node.toLowerCase().includes(q)
      );
    }
    if (nodeFilter !== "all") {
      result = result.filter((s) => s.node === nodeFilter);
    }
    return result;
  }, [shards, search, nodeFilter]);

  const stateColor = (state: string) => {
    switch (state) {
      case "STARTED":
        return "text-green-500";
      case "RELOCATING":
        return "text-blue-500";
      case "INITIALIZING":
        return "text-yellow-500";
      case "UNASSIGNED":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Shards</h2>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {filtered.length}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by index or node..."
            className="h-9 pl-9 text-xs"
          />
        </div>
        <select
          value={nodeFilter}
          onChange={(e) => setNodeFilter(e.target.value)}
          className="h-9 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground"
        >
          <option value="all">All nodes</option>
          {nodes.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Index
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Shard
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                State
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Docs
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Store
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Node
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                IP
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((shard, i) => (
              <tr
                key={`${shard.index}-${shard.shard}-${shard.prirep}-${i}`}
                className="border-b border-border/30 transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {shard.index}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {shard.shard}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      shard.prirep === "p"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-purple-500/10 text-purple-500"
                    }`}
                  >
                    {shard.prirep === "p" ? "Primary" : "Replica"}
                  </span>
                </td>
                <td className={`px-4 py-2.5 font-medium ${stateColor(shard.state)}`}>
                  <div className="flex items-center gap-1.5">
                    <Grid3X3 className="size-3" />
                    {shard.state}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {Number(shard.docs).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {shard.store}
                </td>
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {shard.node}
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">
                  {shard.ip}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">No shards match your filters.</p>
        </div>
      )}
    </div>
  );
}