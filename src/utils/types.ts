
export type LogLevelString = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  timestamp: string;
  level: LogLevelString;
  message: string;
  meta?: Record<string, any>;
}

export interface CacheEntry<T = any> {
  data: T;
  expiry: number;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepositorySummary {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  description: string | null;
  created_at: string;
}

export interface GitHubIssueSummary {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  user: GitHubUser;
  html_url: string;
  body: string | null;
  comments: number;
}

export interface MCPTextContent {
  type: "text";
  text: string;
}

export interface MCPResponse {
  content: MCPTextContent[];
  isError?: boolean;
  [key: string]: unknown; 
}


export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: unknown) => Promise<MCPResponse>;
}