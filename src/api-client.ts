import { Session } from './types';
import { PulseData, TodayStats, TokenProvider } from './types';
import { REQUEST_TIMEOUT_MS, PULSE_TIMEOUT_MS } from './constants';

export type { PulseData, TodayStats, TokenProvider };

/** HTTP client for communicating with the GitAgora API server. */
export class ApiClient {
  private tokenProvider: TokenProvider = async () => null;

  constructor(private apiUrl: string) {}

  /** Update the base API URL (called when settings change). */
  updateConfig(apiUrl: string): void {
    this.apiUrl = apiUrl;
  }

  /** Set the function used to retrieve the auth token on each request. */
  setTokenProvider(provider: TokenProvider): void {
    this.tokenProvider = provider;
  }

  /** Check whether the user currently has a valid auth token. */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.tokenProvider();
    return token !== null && token.length > 0;
  }

  private async getToken(): Promise<string | null> {
    return this.tokenProvider();
  }

  /** Send completed sessions to the server. Returns true on success. */
  async sendHeartbeats(sessions: Session[]): Promise<boolean> {
    const token = await this.getToken();
    if (!token || sessions.length === 0) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessions }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        console.error(`[GitAgora] Heartbeat POST failed: ${response.status}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[GitAgora] Heartbeat POST error:', err);
      return false;
    }
  }

  /** Send a live presence pulse to the server (fire-and-forget). */
  async sendPulse(data: PulseData | { status: 'stopped'; window_id: string } | null): Promise<void> {
    const token = await this.getToken();
    if (!token) {
      return;
    }

    const body = data ?? { status: 'stopped' as const };

    try {
      await fetch(`${this.apiUrl}/api/pulse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(PULSE_TIMEOUT_MS),
      });
    } catch {
      // Fire-and-forget: silently ignore errors
    }
  }

  /** Fetch today's coding stats from the server. Returns null on failure. */
  async getTodayStats(): Promise<TodayStats | null> {
    const token = await this.getToken();
    if (!token) {
      return null;
    }

    try {
      const tzOffset = new Date().getTimezoneOffset();
      const response = await fetch(`${this.apiUrl}/api/heartbeat?today=true&tz_offset=${tzOffset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        console.error(`[GitAgora] Stats GET failed: ${response.status}`);
        return null;
      }

      const data: unknown = await response.json();
      if (!isValidTodayStats(data)) {
        console.error('[GitAgora] Stats response failed validation');
        return null;
      }

      return data;
    } catch (err) {
      console.error('[GitAgora] Stats GET error:', err);
      return null;
    }
  }
}

function isValidTodayStats(data: unknown): data is TodayStats {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.total_seconds === 'number' &&
    typeof obj.sessions_count === 'number' &&
    typeof obj.languages === 'object' &&
    obj.languages !== null
  );
}
