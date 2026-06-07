export interface ElasticsearchConnection {
  id: string;
  name: string;
  url: string;
  authType: "none" | "basic" | "apikey" | "bearer";
  username?: string;
  password?: string;
  apiKey?: string;
  bearerToken?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  version?: string;
  clusterName?: string;
}

const STORAGE_KEY = "es-connections";
const ACTIVE_CONNECTION_KEY = "es-active-connection";

export function generateId(): string {
  return crypto.randomUUID();
}

export function getConnections(): ElasticsearchConnection[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveConnection(
  connection: Omit<ElasticsearchConnection, "id" | "createdAt" | "updatedAt">
): ElasticsearchConnection {
  const connections = getConnections();
  const now = Date.now();
  const newConnection: ElasticsearchConnection = {
    ...connection,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  connections.push(newConnection);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  return newConnection;
}

export function updateConnection(
  id: string,
  updates: Partial<ElasticsearchConnection>
): ElasticsearchConnection | null {
  const connections = getConnections();
  const index = connections.findIndex((c) => c.id === id);
  if (index === -1) return null;
  connections[index] = {
    ...connections[index],
    ...updates,
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  return connections[index];
}

export function deleteConnection(id: string): boolean {
  const connections = getConnections();
  const filtered = connections.filter((c) => c.id !== id);
  if (filtered.length === connections.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  if (getActiveConnection()?.id === id) {
    localStorage.removeItem(ACTIVE_CONNECTION_KEY);
  }
  return true;
}

export function getActiveConnection(): ElasticsearchConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(ACTIVE_CONNECTION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setActiveConnection(connection: ElasticsearchConnection): void {
  localStorage.setItem(ACTIVE_CONNECTION_KEY, JSON.stringify(connection));
}

export function clearActiveConnection(): void {
  localStorage.removeItem(ACTIVE_CONNECTION_KEY);
}

export function buildHeaders(connection: ElasticsearchConnection): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  switch (connection.authType) {
    case "basic":
      if (connection.username && connection.password) {
        headers["Authorization"] =
          "Basic " + btoa(`${connection.username}:${connection.password}`);
      }
      break;
    case "apikey":
      if (connection.apiKey) {
        headers["Authorization"] = `ApiKey ${connection.apiKey}`;
      }
      break;
    case "bearer":
      if (connection.bearerToken) {
        headers["Authorization"] = `Bearer ${connection.bearerToken}`;
      }
      break;
  }

  return headers;
}

export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = "http://" + normalized;
  }
  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}