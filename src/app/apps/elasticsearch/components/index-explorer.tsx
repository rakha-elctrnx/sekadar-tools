"use client";

import { useState, useEffect, useMemo } from "react";
import type { ElasticsearchConnection } from "../lib/connection";
import { createClient } from "../lib/elasticsearch-api";
import type { CatIndex } from "../lib/elasticsearch-api";
import { Search, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  connection: ElasticsearchConnection;
  onSelectIndex?: (index: string) => void;
}

type SortKey = "index" | "docs.count" | "store.size" | "health";

export function IndexExplorer({ connection, onSelectIndex }: Props) {
  const [indices, setIndices] = useState<CatIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("index");
  const [sortAsc, setSortAsc] = useState(true);
  const [healthFilter, setHealthFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      const client = createClient(connection);
      const result = await client.getCatIndices();
      if (cancelled) return;
      if (result.success) {
        setIndices(result.data || []);
      } else {
        setError(result.error || "Failed to fetch indices");
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
    const result = await client.getCatIndices();
    if (result.success) {
      setIndices(result.data || []);
    } else {
      setError(result.error || "Failed to fetch indices");
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = indices;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((idx) => idx.index.toLowerCase().includes(q));
    }
    if (healthFilter !== "all") {
      result = result.filter((idx) => idx.health === healthFilter);
    }
    result = [...result].sort((a, b) => {
      const aVal = a[sortKey] || "";
      const bVal = b[sortKey] || "";
      if (sortKey === "docs.count" || sortKey === "store.size") {
        const aNum = parseFloat(String(aVal).replace(/,/g, ""));
        const bNum = parseFloat(String(bVal).replace(/,/g, ""));
        return sortAsc ? aNum - bNum : bNum - aNum;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [indices, search, sortKey, sortAsc, healthFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
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
        <div>
          <h2 className="text-lg font-semibold text-foreground">Indices</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {filtered.length} of {indices.length} indices
          </p>
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
            placeholder="Search indices..."
            className="h-9 pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "green", "yellow", "red"].map((h) => (
            <button
              key={h}
              onClick={() => setHealthFilter(h)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                healthFilter === h
                  ? h === "all"
                    ? "bg-foreground/10 text-foreground"
                    : h === "green"
                      ? "bg-green-500/10 text-green-500"
                      : h === "yellow"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-red-500/10 text-red-500"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {h.charAt(0).toUpperCase() + h.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th
                className="cursor-pointer px-4 py-2.5 font-medium text-muted-foreground hover:text-foreground"
                onClick={() => toggleSort("index")}
              >
                Index {sortKey === "index" && <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>}
              </th>
              <th
                className="cursor-pointer px-4 py-2.5 font-medium text-muted-foreground hover:text-foreground"
                onClick={() => toggleSort("health")}
              >
                Health {sortKey === "health" && <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>}
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Status
              </th>
              <th
                className="cursor-pointer px-4 py-2.5 font-medium text-muted-foreground hover:text-foreground"
                onClick={() => toggleSort("docs.count")}
              >
                Docs {sortKey === "docs.count" && <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>}
              </th>
              <th
                className="cursor-pointer px-4 py-2.5 font-medium text-muted-foreground hover:text-foreground"
                onClick={() => toggleSort("store.size")}
              >
                Size {sortKey === "store.size" && <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>}
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((idx) => (
              <tr
                key={idx.index}
                className="border-b border-border/30 transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {idx.index}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block size-2 rounded-full ${
                      idx.health === "green"
                        ? "bg-green-500"
                        : idx.health === "yellow"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="ml-1.5">{idx.health}</span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {idx.status}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {Number(idx["docs.count"]).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {idx["store.size"]}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {idx["creation.date.string"] || "—"}
                </td>
                <td className="px-4 py-2.5">
                  {onSelectIndex && (
                    <button
                      onClick={() => onSelectIndex(idx.index)}
                      className="inline-flex items-center gap-1 text-[#c5030c] hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      Browse
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No indices match your filters.
          </p>
        </div>
      )}
    </div>
  );
}