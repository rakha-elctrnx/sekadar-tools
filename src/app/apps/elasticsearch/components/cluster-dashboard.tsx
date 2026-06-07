"use client";

import { useState, useEffect } from "react";
import type { ElasticsearchConnection } from "../lib/connection";
import { createClient } from "../lib/elasticsearch-api";
import type { ClusterHealth } from "../lib/elasticsearch-api";
import {
  Activity,
  Server,
  Database,
  HardDrive,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";

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

function StatusDot({ status }: { status: string }) {
  const colors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };
  return (
    <span
      className={`inline-block size-2.5 rounded-full ${colors[status as keyof typeof colors] || "bg-gray-400"}`}
    />
  );
}

export function ClusterDashboard({ connection }: Props) {
  const [health, setHealth] = useState<ClusterHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      const client = createClient(connection);
      const result = await client.getClusterHealth();
      if (cancelled) return;
      if (result.success) {
        setHealth(result.data!);
      } else {
        setError(result.error || "Failed to fetch cluster health");
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
    const result = await client.getClusterHealth();
    if (result.success) {
      setHealth(result.data!);
    } else {
      setError(result.error || "Failed to fetch cluster health");
    }
    setLoading(false);
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
        <AlertTriangle className="mx-auto mb-3 size-8 text-destructive" />
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

  if (!health) return null;

  const stats = [
    {
      label: "Cluster Status",
      value: health.status.toUpperCase(),
      icon: Activity,
      color:
        health.status === "green"
          ? "text-green-500"
          : health.status === "yellow"
            ? "text-yellow-500"
            : "text-red-500",
      extra: <StatusDot status={health.status} />,
    },
    {
      label: "Nodes",
      value: health.number_of_nodes.toString(),
      icon: Server,
      color: "text-blue-500",
      extra: `${health.number_of_data_nodes} data nodes`,
    },
    {
      label: "Active Shards",
      value: health.active_shards.toString(),
      icon: Database,
      color: "text-purple-500",
      extra: `${health.active_primary_shards} primary`,
    },
    {
      label: "Unassigned Shards",
      value: health.unassigned_shards.toString(),
      icon: HardDrive,
      color:
        health.unassigned_shards > 0 ? "text-yellow-500" : "text-green-500",
      extra:
        health.relocating_shards > 0
          ? `${health.relocating_shards} relocating`
          : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cluster: {health.cluster_name}
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
                  <Icon className="size-4" />
                </div>
                {stat.extra}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Cluster Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Cluster Name" value={health.cluster_name} />
          <DetailRow label="Status" value={health.status.toUpperCase()} />
          <DetailRow
            label="Number of Nodes"
            value={health.number_of_nodes.toString()}
          />
          <DetailRow
            label="Data Nodes"
            value={health.number_of_data_nodes.toString()}
          />
          <DetailRow
            label="Active Primary Shards"
            value={health.active_primary_shards.toString()}
          />
          <DetailRow
            label="Active Shards"
            value={health.active_shards.toString()}
          />
          <DetailRow
            label="Relocating Shards"
            value={health.relocating_shards.toString()}
          />
          <DetailRow
            label="Initializing Shards"
            value={health.initializing_shards.toString()}
          />
          <DetailRow
            label="Unassigned Shards"
            value={health.unassigned_shards.toString()}
          />
          <DetailRow
            label="Pending Tasks"
            value={health.number_of_pending_tasks.toString()}
          />
          <DetailRow
            label="In-Flight Fetches"
            value={health.number_of_in_flight_fetch.toString()}
          />
          <DetailRow
            label="Active Shards %"
            value={`${health.active_shards_percent_as_number}%`}
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}