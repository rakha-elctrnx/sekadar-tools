"use client";

import { useState, useEffect } from "react";
import type { ElasticsearchConnection } from "../lib/connection";
import { createClient } from "../lib/elasticsearch-api";
import { Search, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  connection: ElasticsearchConnection;
}

interface FieldNode {
  name: string;
  type: string;
  children?: FieldNode[];
}

function buildFieldTree(
  properties: Record<string, unknown>,
  prefix = ""
): FieldNode[] {
  return Object.entries(properties).map(([key, value]) => {
    const val = value as Record<string, unknown>;
    const fullName = prefix ? `${prefix}.${key}` : key;
    const children = val.properties
      ? buildFieldTree(val.properties as Record<string, unknown>, fullName)
      : undefined;
    return {
      name: key,
      type: String(val.type || "object"),
      children,
    };
  });
}

function FieldRow({
  node,
  depth,
  search,
}: {
  node: FieldNode;
  depth: number;
  search: string;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  if (search && !node.name.toLowerCase().includes(search.toLowerCase())) {
    if (!hasChildren) return null;
    const hasMatch = node.children!.some((child) =>
      child.name.toLowerCase().includes(search.toLowerCase())
    );
    if (!hasMatch) return null;
  }

  return (
    <div>
      <div
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted/50"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </button>
        ) : (
          <span className="size-3" />
        )}
        <span className="font-medium text-foreground">{node.name}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {node.type}
        </span>
      </div>
      {expanded &&
        hasChildren &&
        node.children!.map((child) => (
          <FieldRow
            key={child.name}
            node={child}
            depth={depth + 1}
            search={search}
          />
        ))}
    </div>
  );
}

export function MappingViewer({ connection }: Props) {
  const [indices, setIndices] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState("");
  const [mappings, setMappings] = useState<Record<string, unknown> | null>(null);
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
    async function fetchMapping() {
      setLoading(true);
      setError(null);
      const client = createClient(connection);
      const result = await client.getMapping(selectedIndex);
      if (cancelled) return;
      if (result.success && result.data) {
        const indexData = (result.data as unknown as Record<string, Record<string, unknown>>)[selectedIndex];
        setMappings((indexData?.mappings as Record<string, unknown>) || null);
      } else {
        setError(result.error || "Failed to fetch mapping");
      }
      setLoading(false);
    }
    fetchMapping();
    return () => { cancelled = true; };
  }, [connection.id, selectedIndex]);

  const fieldTree = mappings?.properties
    ? buildFieldTree(mappings.properties as Record<string, unknown>)
    : [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Mapping Viewer</h2>

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
            placeholder="Search fields..."
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

      {!loading && !error && fieldTree.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-2">
          {fieldTree.map((node) => (
            <FieldRow key={node.name} node={node} depth={0} search={search} />
          ))}
        </div>
      )}

      {!loading && !error && selectedIndex && fieldTree.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">No mapping data found.</p>
        </div>
      )}
    </div>
  );
}