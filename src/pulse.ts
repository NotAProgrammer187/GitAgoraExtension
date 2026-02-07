import * as crypto from 'crypto';
import { ApiClient, PulseData } from './api-client';
import { SessionManager } from './session-manager';

const PULSE_INTERVAL = 30_000; // 30 seconds

export class PulseSender {
  private intervalId: ReturnType<typeof setInterval> | undefined;
  private readonly windowId: string;

  constructor(
    private apiClient: ApiClient,
    private sessionManager: SessionManager
  ) {
    this.windowId = crypto.randomUUID();
  }

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
        window_id: this.windowId,
      };
      this.apiClient.sendPulse(data);
    } else {
      this.apiClient.sendPulse({ status: 'stopped', window_id: this.windowId });
    }
  }

  sendStop(): void {
    this.apiClient.sendPulse({ status: 'stopped', window_id: this.windowId });
  }

  dispose(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
