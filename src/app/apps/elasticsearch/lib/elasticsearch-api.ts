import {
  type ElasticsearchConnection,
  buildHeaders,
  normalizeUrl,
} from "./connection";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  duration?: number;
}

class ElasticsearchClient {
  private connection: ElasticsearchConnection;

  constructor(connection: ElasticsearchConnection) {
    this.connection = connection;
  }

  private get baseUrl(): string {
    return normalizeUrl(this.connection.url);
  }

  private get headers(): Record<string, string> {
    return buildHeaders(this.connection);
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const start = performance.now();

    try {
      const init: RequestInit = {
        method,
        headers: this.headers,
        mode: "cors",
      };

      if (body !== undefined && method !== "GET") {
        init.body = JSON.stringify(body);
      }

      const response = await fetch(url, init);
      const duration = performance.now() - start;

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody.error?.reason) {
            errorMessage = errorBody.error.reason;
          }
        } catch {
          // ignore parse error
        }
        return {
          success: false,
          error: errorMessage,
          statusCode: response.status,
          duration,
        };
      }

      const data = await response.json();
      return { success: true, data: data as T, duration };
    } catch (err) {
      const duration = performance.now() - start;
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error",
        duration,
      };
    }
  }

  // Cluster
  async getClusterHealth() {
    return this.request<ClusterHealth>("GET", "/_cluster/health");
  }

  async getCatNodes() {
    return this.request<unknown[]>("GET", "/_cat/nodes?v&format=json");
  }

  async getCatIndices() {
    return this.request<CatIndex[]>("GET", "/_cat/indices?format=json&s=index:asc");
  }

  // Documents
  async search(index: string, body: SearchQuery) {
    const path = index ? `/${index}/_search` : `/_search`;
    return this.request<SearchResponse>("POST", path, body);
  }

  async getDocument(index: string, id: string) {
    return this.request<DocumentResponse>("GET", `/${index}/_doc/${id}`);
  }

  async indexDocument(
    index: string,
    id: string | undefined,
    body: Record<string, unknown>
  ) {
    const path = id ? `/${index}/_doc/${id}` : `/${index}/_doc`;
    return this.request<{ result: string; _id: string }>("PUT", path, body);
  }

  async updateDocument(
    index: string,
    id: string,
    body: { doc: Record<string, unknown> }
  ) {
    return this.request<{ result: string }>(
      "POST",
      `/${index}/_update/${id}`,
      body
    );
  }

  async deleteDocument(index: string, id: string) {
    return this.request<{ result: string }>("DELETE", `/${index}/_doc/${id}`);
  }

  // Mappings & Settings
  async getMapping(index: string) {
    return this.request<Record<string, MappingResponse>>(
      "GET",
      `/${index}/_mapping`
    );
  }

  async getSettings(index: string) {
    return this.request<Record<string, SettingsResponse>>(
      "GET",
      `/${index}/_settings`
    );
  }

  // Aliases
  async getAliases() {
    return this.request<Record<string, { aliases: Record<string, unknown> }>>(
      "GET",
      "/_aliases"
    );
  }

  async manageAliases(body: AliasAction[]) {
    return this.request<{ acknowledged: boolean }>("POST", "/_aliases", { actions: body });
  }

  // Nodes
  async getNodesStats() {
    return this.request<NodesStatsResponse>("GET", "/_nodes/stats");
  }

  // Shards
  async getCatShards() {
    return this.request<CatShard[]>("GET", "/_cat/shards?format=json&s=index:asc");
  }
}

// Types
export interface ClusterHealth {
  cluster_name: string;
  status: "green" | "yellow" | "red";
  number_of_nodes: number;
  number_of_data_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  number_of_pending_tasks: number;
  number_of_in_flight_fetch: number;
  timed_out: boolean;
  active_shards_percent_as_number: number;
}

export interface CatIndex {
  health: string;
  status: string;
  index: string;
  "docs.count": string;
  "docs.deleted": string;
  "store.size": string;
  "pri.store.size": string;
  "creation.date.string": string;
}

export interface SearchQuery {
  query: Record<string, unknown>;
  size?: number;
  from?: number;
  sort?: Record<string, unknown>[];
  _source?: boolean | string[];
  highlight?: Record<string, unknown>;
  aggs?: Record<string, unknown>;
}

export interface SearchResponse {
  took: number;
  timed_out: boolean;
  hits: {
    total: { value: number; relation: string };
    max_score: number;
    hits: SearchHit[];
  };
  aggregations?: Record<string, unknown>;
}

export interface SearchHit {
  _index: string;
  _id: string;
  _score: number;
  _source: Record<string, unknown>;
  sort?: unknown[];
  highlight?: Record<string, string[]>;
}

export interface DocumentResponse {
  _index: string;
  _id: string;
  _version: number;
  found: boolean;
  _source: Record<string, unknown>;
}

export interface MappingResponse {
  mappings: {
    properties: Record<string, PropertyMapping>;
  };
}

export interface PropertyMapping {
  type: string;
  fields?: Record<string, PropertyMapping>;
}

export interface SettingsResponse {
  settings: {
    index: Record<string, unknown>;
  };
}

export interface AliasAction {
  add?: { index: string; alias: string };
  remove?: { index: string; alias: string };
}

export interface NodesStatsResponse {
  cluster_name: string;
  nodes: Record<string, NodeStats>;
}

export interface NodeStats {
  name: string;
  host: string;
  ip: string;
  roles: string[];
  os?: {
    cpu?: {
      percent: number;
      load_average?: Record<string, number>;
    };
    mem?: {
      total_in_bytes: number;
      free_in_bytes: number;
      used_in_bytes: number;
      used_percent: number;
    };
  };
  jvm?: {
    mem: {
      heap_used_in_bytes: number;
      heap_max_in_bytes: number;
      non_heap_used_in_bytes: number;
    };
    gc?: {
      collectors?: Record<string, { collection_count: number; collection_time_in_millis: number }>;
    };
    version?: string;
  };
  fs?: {
    total?: {
      total_in_bytes: number;
      free_in_bytes: number;
      available_in_bytes: number;
    };
  };
  index?: {
    indexing?: { index_total: number; index_time_in_millis: number };
    search?: { query_total: number; query_time_in_millis: number };
  };
}

export interface CatShard {
  index: string;
  shard: string;
  prirep: "p" | "r";
  state: string;
  docs: string;
  store: string;
  ip: string;
  node: string;
}

export function createClient(
  connection: ElasticsearchConnection
): ElasticsearchClient {
  return new ElasticsearchClient(connection);
}