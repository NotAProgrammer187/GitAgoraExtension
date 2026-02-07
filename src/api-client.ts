import { Session } from './session-manager';

const REQUEST_TIMEOUT = 30_000;
const PULSE_TIMEOUT = 5_000;

export interface PulseData {
  status: 'active';
  language: string;
  project_name: string | null;
  current_seconds: number;
  started_at: string;
}

export interface TodayStats {
  total_seconds: number;
  languages: Record<string, number>;
  sessions_count: number;
}

export class ApiClient {
  private token: string = '';

  constructor(private apiUrl: string) {}

  updateConfig(apiUrl: string): void {
    this.apiUrl = apiUrl;
  }

  setToken(token: string): void {
    this.token = token;
  }

  isAuthenticated(): boolean {
    return this.token.length > 0;
  }

  async sendHeartbeats(sessions: Session[]): Promise<boolean> {
    if (!this.token || sessions.length === 0) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessions }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
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

  async sendPulse(data: PulseData | null): Promise<void> {
    if (!this.token) {
      return;
    }

    const body = data ?? { status: 'stopped' as const };

    try {
      await fetch(`${this.apiUrl}/api/pulse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(PULSE_TIMEOUT),
      });
    } catch {
      // Fire-and-forget: silently ignore errors
    }
  }

  async getTodayStats(): Promise<TodayStats | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/heartbeat?today=true`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      if (!response.ok) {
        console.error(`[GitAgora] Stats GET failed: ${response.status}`);
        return null;
      }

      return (await response.json()) as TodayStats;
    } catch (err) {
      console.error('[GitAgora] Stats GET error:', err);
      return null;
    }
  }
}
