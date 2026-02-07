import { Session } from './session-manager';
import { ApiClient } from './api-client';
import { Storage } from './storage';

const FLUSH_INTERVAL = 2 * 60 * 1000; // 2 minutes

export class HeartbeatSender {
  private queue: Session[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly apiClient: ApiClient,
    private readonly storage: Storage
  ) {}

  async start(): Promise<void> {
    // Load any persisted sessions from previous runs
    const persisted = this.storage.loadPendingSessions();
    if (persisted.length > 0) {
      this.queue.push(...persisted);
    }

    // Start periodic flush
    this.flushInterval = setInterval(() => this.flush(), FLUSH_INTERVAL);

    // Try an initial flush for any recovered sessions
    if (this.queue.length > 0) {
      await this.flush();
    }
  }

  enqueue(session: Session): void {
    this.queue.push(session);
    // Flush immediately so sessions aren't lost if the extension shuts down
    this.flush();
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const toSend = [...this.queue];
    const success = await this.apiClient.sendHeartbeats(toSend);

    if (success) {
      // Remove sent sessions from queue
      this.queue.splice(0, toSend.length);
      await this.storage.clearPendingSessions();
    } else {
      // Persist for later retry
      await this.storage.savePendingSessions(this.queue);
    }
  }

  async dispose(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Best-effort flush on shutdown
    await this.flush();

    // Persist anything still unsent
    if (this.queue.length > 0) {
      await this.storage.savePendingSessions(this.queue);
    }
  }
}
