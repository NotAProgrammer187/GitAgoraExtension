/** A completed coding session ready to be sent to the server. */
export interface Session {
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  language: string;
  project_name: string | null;
}

/** Info about the currently active session (for pulse/status bar). */
export interface ActiveSessionInfo {
  language: string;
  projectName: string | null;
  currentSeconds: number;
  startedAt: string;
}

/** Live presence data sent to the server every pulse interval. */
export interface PulseData {
  status: 'active';
  language: string;
  project_name: string | null;
  current_seconds: number;
  started_at: string;
  window_id: string;
}

/** Today's coding statistics returned by the server. */
export interface TodayStats {
  total_seconds: number;
  languages: Record<string, number>;
  sessions_count: number;
}

/** Extension configuration from VS Code settings. */
export interface GitAgoraConfig {
  apiUrl: string;
  idleTimeout: number;
  trackProjectNames: boolean;
}

/** Function that retrieves the current auth token, or null if not authenticated. */
export type TokenProvider = () => Promise<string | null>;
