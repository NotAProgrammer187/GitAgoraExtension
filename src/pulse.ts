import { ApiClient, PulseData } from './api-client';
import { SessionManager } from './session-manager';

const PULSE_INTERVAL = 30_000; // 30 seconds

export class PulseSender {
  private intervalId: ReturnType<typeof setInterval> | undefined;

  constructor(
    private apiClient: ApiClient,
    private sessionManager: SessionManager
  ) {}

  start(): void {
    this.intervalId = setInterval(() => this.tick(), PULSE_INTERVAL);
  }

  private tick(): void {
    const info = this.sessionManager.getActiveSessionInfo();
    if (info) {
      const data: PulseData = {
        status: 'active',
        language: info.language,
        project_name: info.projectName,
        current_seconds: info.currentSeconds,
        started_at: info.startedAt,
      };
      this.apiClient.sendPulse(data);
    } else {
      this.apiClient.sendPulse(null);
    }
  }

  sendStop(): void {
    this.apiClient.sendPulse(null);
  }

  dispose(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
