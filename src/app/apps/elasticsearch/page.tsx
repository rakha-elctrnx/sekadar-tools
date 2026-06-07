"use client";

import { useState, useCallback } from "react";
import {
  type ElasticsearchConnection,
  getConnections,
  saveConnection,
  updateConnection,
  deleteConnection,
  getActiveConnection,
  setActiveConnection,
  clearActiveConnection,
  normalizeUrl,
} from "./lib/connection";
import { createClient, type ApiResponse } from "./lib/elasticsearch-api";
import { ClusterDashboard } from "./components/cluster-dashboard";
import { IndexExplorer } from "./components/index-explorer";
import { DocumentBrowser } from "./components/document-browser";
import { QueryPlayground } from "./components/query-playground";
import { MappingViewer } from "./components/mapping-viewer";
import { SettingsViewer } from "./components/settings-viewer";
import { AliasManager } from "./components/alias-manager";
import { NodeViewer } from "./components/node-viewer";
import { ShardViewer } from "./components/shard-viewer";
import {
  Plus,
  Edit3,
  Trash2,
  Plug,
  PlugZap,
  ArrowLeft,
  LayoutDashboard,
  FolderSearch,
  FileSearch,
  Code2,
  Map,
  Settings,
  Tag,
  Server,
  Grid3X3,
  LogOut,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type AppView =
  | "dashboard"
  | "indices"
  | "documents"
  | "query"
  | "mappings"
  | "settings"
  | "aliases"
  | "nodes"
  | "shards";

const NAV_ITEMS: { key: AppView; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "indices", label: "Indices", icon: FolderSearch },
  { key: "documents", label: "Documents", icon: FileSearch },
  { key: "query", label: "Query DSL", icon: Code2 },
  { key: "mappings", label: "Mappings", icon: Map },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "aliases", label: "Aliases", icon: Tag },
  { key: "nodes", label: "Nodes", icon: Server },
  { key: "shards", label: "Shards", icon: Grid3X3 },
];

export default function ElasticsearchPage() {
  const [connections, setConnections] = useState<ElasticsearchConnection[]>(() => {
    if (typeof window === "undefined") return [];
    return getConnections();
  });
  const [activeConnection, setActiveConn] = useState<ElasticsearchConnection | null>(() => {
    if (typeof window === "undefined") return null;
    return getActiveConnection();
  });
  const [view, setView] = useState<AppView>("dashboard");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [testResult, setTestResult] = useState<{
    id: string;
    result: ApiResponse;
  } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formAuthType, setFormAuthType] = useState<
    "none" | "basic" | "apikey" | "bearer"
  >("none");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formBearerToken, setFormBearerToken] = useState("");


  const refreshConnections = useCallback(() => {
    setConnections(getConnections());
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormUrl("");
    setFormAuthType("none");
    setFormUsername("");
    setFormPassword("");
    setFormApiKey("");
    setFormBearerToken("");
    setEditingId(null);
    setShowForm(false);
    setTestResult(null);
  };

  const startEdit = (conn: ElasticsearchConnection) => {
    setEditingId(conn.id);
    setFormName(conn.name);
    setFormUrl(conn.url);
    setFormAuthType(conn.authType);
    setFormUsername(conn.username || "");
    setFormPassword(conn.password || "");
    setFormApiKey(conn.apiKey || "");
    setFormBearerToken(conn.bearerToken || "");
    setShowForm(true);
    setTestResult(null);
  };

  const handleSave = () => {
    const data = {
      name: formName,
      url: normalizeUrl(formUrl),
      authType: formAuthType,
      username: formUsername || undefined,
      password: formPassword || undefined,
      apiKey: formApiKey || undefined,
      bearerToken: formBearerToken || undefined,
    };

    if (editingId) {
      updateConnection(editingId, data);
    } else {
      saveConnection(data);
    }
    refreshConnections();
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteConnection(id);
    refreshConnections();
  };

  const handleConnect = (conn: ElasticsearchConnection) => {
    setActiveConnection(conn);
    setActiveConn(conn);
    setView("dashboard");
  };

  const handleDisconnect = () => {
    clearActiveConnection();
    setActiveConn(null);
  };

  const handleTest = async (conn: ElasticsearchConnection) => {
    setTesting(conn.id);
    const client = createClient(conn);
    const result = await client.request<{ version?: { number: string }; cluster_name?: string }>(
      "GET",
      "/"
    );
    setTestResult({ id: conn.id, result });
    setTesting(null);
  };

  // Connected view
  if (activeConnection) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-border/50 bg-card/50 lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-border/50 p-4">
              <button
                onClick={handleDisconnect}
                className="mb-3 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Connections
              </button>
              <h2 className="truncate text-sm font-semibold text-foreground">
                {activeConnection.name}
              </h2>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {activeConnection.url}
              </p>
            </div>
            <nav className="flex-1 space-y-0.5 p-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setView(item.key)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      view === item.key
                        ? "bg-[#c5030c]/10 text-[#c5030c]"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="border-t border-border/50 p-2">
              <button
                onClick={handleDisconnect}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-4" />
                Disconnect
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto border-b border-border/50 px-4 py-2 lg:hidden">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    view === item.key
                      ? "bg-[#c5030c]/10 text-[#c5030c]"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={handleDisconnect}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {view === "dashboard" && (
              <ClusterDashboard connection={activeConnection} />
            )}
            {view === "indices" && (
              <IndexExplorer
                connection={activeConnection}
                onSelectIndex={(index: string) => {
                  // Store selected index and switch to documents view
                  (window as unknown as { _esSelectedIndex: string })._esSelectedIndex = index;
                  setView("documents");
                }}
              />
            )}
            {view === "documents" && (
              <DocumentBrowser connection={activeConnection} />
            )}
            {view === "query" && (
              <QueryPlayground connection={activeConnection} />
            )}
            {view === "mappings" && (
              <MappingViewer connection={activeConnection} />
            )}
            {view === "settings" && (
              <SettingsViewer connection={activeConnection} />
            )}
            {view === "aliases" && (
              <AliasManager connection={activeConnection} />
            )}
            {view === "nodes" && (
              <NodeViewer connection={activeConnection} />
            )}
            {view === "shards" && (
              <ShardViewer connection={activeConnection} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Connection manager view
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-[#c5030c]/10">
          <Plug className="size-6 text-[#c5030c]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Elasticsearch Explorer
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect to your Elasticsearch cluster to manage indices, query data,
          and explore your cluster.
        </p>
      </div>

      {/* Saved Connections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Saved Connections
          </h2>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="gap-1.5 bg-[#c5030c] text-white hover:bg-[#a50209]"
          >
            <Plus className="size-3.5" />
            Add Connection
          </Button>
        </div>

        {connections.length === 0 && !showForm && (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
            <PlugZap className="mx-auto mb-3 size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No saved connections yet. Add a connection to get started.
            </p>
          </div>
        )}

        {connections.map((conn) => (
          <div
            key={conn.id}
            className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {conn.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] uppercase"
                  >
                    {conn.authType}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {conn.url}
                </p>
                {testResult && testResult.id === conn.id && (
                  <div
                    className={`mt-2 flex items-center gap-1.5 text-xs ${
                      testResult.result.success
                        ? "text-green-500"
                        : "text-destructive"
                    }`}
                  >
                    {testResult.result.success ? (
                      <>
                        <Check className="size-3.5" />
                        Connected
                        {testResult.result.data &&
                          typeof testResult.result.data === "object" &&
                          testResult.result.data !== null &&
                          "version" in testResult.result.data && (
                            <span className="text-muted-foreground">
                              {" "}
                              — v
                              {(testResult.result.data as { version: { number: string } }).version.number}
                            </span>
                          )}
                      </>
                    ) : (
                      <>
                        <X className="size-3.5" />
                        {testResult.result.error}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleTest(conn)}
                  disabled={testing === conn.id}
                  title="Test connection"
                >
                  {testing === conn.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <PlugZap className="size-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startEdit(conn)}
                  title="Edit"
                >
                  <Edit3 className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(conn.id)}
                  title="Delete"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConnect(conn)}
                  className="ml-1 gap-1 bg-[#c5030c] text-white hover:bg-[#a50209]"
                >
                  <Plug className="size-3.5" />
                  Connect
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-border/60 bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {editingId ? "Edit Connection" : "New Connection"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="My Elasticsearch Cluster"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                URL
              </label>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="http://localhost:9200"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Authentication
              </label>
              <select
                value={formAuthType}
                onChange={(e) =>
                  setFormAuthType(
                    e.target.value as "none" | "basic" | "apikey" | "bearer"
                  )
                }
                className="h-9 w-full rounded-md border border-border/60 bg-background px-3 text-sm text-foreground"
              >
                <option value="none">No Authentication</option>
                <option value="basic">Username / Password</option>
                <option value="apikey">API Key</option>
                <option value="bearer">Bearer Token</option>
              </select>
            </div>
            {formAuthType === "basic" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Username
                  </label>
                  <Input
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="elastic"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 text-sm"
                  />
                </div>
              </>
            )}
            {formAuthType === "apikey" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  API Key
                </label>
                <Input
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  placeholder="Encoded API Key"
                  className="h-9 text-sm"
                />
              </div>
            )}
            {formAuthType === "bearer" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Bearer Token
                </label>
                <Input
                  value={formBearerToken}
                  onChange={(e) => setFormBearerToken(e.target.value)}
                  placeholder="Bearer token"
                  className="h-9 text-sm"
                />
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={!formName || !formUrl}
                className="gap-1.5 bg-[#c5030c] text-white hover:bg-[#a50209]"
              >
                <Check className="size-3.5" />
                {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}