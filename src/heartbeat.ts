import { Session } from './types';
import { ApiClient } from './api-client';
import { Storage } from './storage';
import { FLUSH_INTERVAL_MS } from './constants';

/** Queues completed sessions and sends them to the server in batches with retry. */
export class HeartbeatSender {
  private queue: Session[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(
    private readonly apiClient: ApiClient,
    private readonly storage: Storage
  ) {}

  /** Load persisted sessions and start the periodic flush timer. */
  async start(): Promise<void> {
    // Load any persisted sessions from previous runs
    const persisted = this.storage.loadPendingSessions();
    if (persisted.length > 0) {
      this.queue.push(...persisted);
    }

    // Start periodic flush
    this.flushInterval = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

    // Try an initial flush for any recovered sessions
    if (this.queue.length > 0) {
      await this.flush();
    }
  }

  /** Add a session to the queue and trigger an immediate flush. */
  enqueue(session: Session): void {
    this.queue.push(session);
    // Flush immediately so sessions aren't lost if the extension shuts down
    this.flush();
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) {
      return;
    }

    this.flushing = true;
    try {
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
    } finally {
      this.flushing = false;
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
