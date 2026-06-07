"use client";

import { useState, useEffect } from "react";
import type { ElasticsearchConnection } from "../lib/connection";
import { createClient, type NodeStats } from "../lib/elasticsearch-api";
import { Server, RefreshCw, Loader2, Cpu, HardDrive, MemoryStick } from "lucide-react";

interface Props {
  connection: ElasticsearchConnection;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function ProgressBar({ percent }: { percent: number }) {
  const color =
    percent > 90
      ? "bg-red-500"
      : percent > 70
        ? "bg-yellow-500"
        : "bg-green-500";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

function NodeCard({ node }: { node: NodeStats }) {
  const heapMax = node.jvm?.mem.heap_max_in_bytes || 0;
  const heapUsed = node.jvm?.mem.heap_used_in_bytes || 0;
  const heapPercent = heapMax > 0 ? (heapUsed / heapMax) * 100 : 0;

  const memTotal = node.os?.mem?.total_in_bytes || 0;
  const memUsed = node.os?.mem?.used_in_bytes || 0;
  const memPercent = node.os?.mem?.used_percent || 0;

  const fsTotal = node.fs?.total?.total_in_bytes || 0;
  const fsFree = node.fs?.total?.free_in_bytes || 0;
  const fsUsed = fsTotal - fsFree;
  const fsPercent = fsTotal > 0 ? (fsUsed / fsTotal) * 100 : 0;

  const cpuPercent = node.os?.cpu?.percent || 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Server className="size-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">
              {node.name}
            </h3>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {node.host} ({node.ip})
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {node.roles?.map((role) => (
            <span
              key={role}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* CPU */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Cpu className="size-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">CPU</span>
          </div>
          <p className="text-lg font-bold text-foreground">{cpuPercent}%</p>
          <ProgressBar percent={cpuPercent} />
          {node.os?.cpu?.load_average && (
            <div className="text-[10px] text-muted-foreground">
              Load:{" "}
              {Object.values(node.os.cpu.load_average)
                .map((v) => v.toFixed(2))
                .join(" / ")}
            </div>
          )}
        </div>

        {/* JVM Heap */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <MemoryStick className="size-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              JVM Heap
            </span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {heapPercent.toFixed(1)}%
          </p>
          <ProgressBar percent={heapPercent} />
          <div className="text-[10px] text-muted-foreground">
            {formatBytes(heapUsed)} / {formatBytes(heapMax)}
          </div>
        </div>

        {/* OS Memory */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <MemoryStick className="size-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Memory
            </span>
          </div>
          <p className="text-lg font-bold text-foreground">{memPercent}%</p>
          <ProgressBar percent={memPercent} />
          <div className="text-[10px] text-muted-foreground">
            {formatBytes(memUsed)} / {formatBytes(memTotal)}
          </div>
        </div>

        {/* Disk */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <HardDrive className="size-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Disk
            </span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {fsPercent.toFixed(1)}%
          </p>
          <ProgressBar percent={fsPercent} />
          <div className="text-[10px] text-muted-foreground">
            {formatBytes(fsUsed)} / {formatBytes(fsTotal)}
          </div>
        </div>
      </div>

      {/* JVM Version */}
      {node.jvm?.version && (
        <div className="mt-3 border-t border-border/30 pt-3">
          <span className="text-[10px] text-muted-foreground">
            JVM: {node.jvm.version}
          </span>
        </div>
      )}
    </div>
  );
}

export function NodeViewer({ connection }: Props) {
  const [nodes, setNodes] = useState<NodeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const client = createClient(connection);
    const result = await client.getNodesStats();
    if (result.success && result.data) {
      const nodeArray = Object.values(result.data.nodes);
      setNodes(nodeArray);
    } else {
      setError(result.error || "Failed to fetch node stats");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      await fetchData();
      if (cancelled) return;
    }
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection.id]);

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
          onClick={fetchData}
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
        <h2 className="text-lg font-semibold text-foreground">
          Nodes ({nodes.length})
        </h2>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {nodes.map((node) => (
          <NodeCard key={node.name} node={node} />
        ))}
      </div>
    </div>
  );
}