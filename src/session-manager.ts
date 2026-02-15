import { Session, ActiveSessionInfo } from './types';
import { MIN_SESSION_DURATION_SECS } from './constants';

export type { Session, ActiveSessionInfo };

/** Manages the current coding session — starts, ends, and tracks active sessions. */
export class SessionManager {
  private currentSession: {
    startedAt: Date;
    language: string;
    projectName: string | null;
  } | null = null;

  private onSessionEnd: ((session: Session) => void) | null = null;

  setOnSessionEnd(callback: (session: Session) => void): void {
    this.onSessionEnd = callback;
  }

  startSession(language: string, projectName: string | null): void {
    this.currentSession = {
      startedAt: new Date(),
      language,
      projectName,
    };
  }

  endSession(endTime: Date = new Date()): Session | null {
    if (!this.currentSession) {
      return null;
    }

    const durationSeconds = Math.floor(
      (endTime.getTime() - this.currentSession.startedAt.getTime()) / 1000
    );

    if (durationSeconds < MIN_SESSION_DURATION_SECS) {
      this.currentSession = null;
      return null;
    }

    const session: Session = {
      started_at: this.currentSession.startedAt.toISOString(),
      ended_at: endTime.toISOString(),
      duration_seconds: durationSeconds,
      language: this.currentSession.language,
      project_name: this.currentSession.projectName,
    };

    this.currentSession = null;
    this.onSessionEnd?.(session);
    return session;
  }

  handleActivity(language: string, projectName: string | null): void {
    if (!this.currentSession) {
      this.startSession(language, projectName);
      return;
    }

    // If language or project changed, end old session and start new one
    if (
      this.currentSession.language !== language ||
      this.currentSession.projectName !== projectName
    ) {
      this.endSession();
      this.startSession(language, projectName);
    }
  }

  hasActiveSession(): boolean {
    return this.currentSession !== null;
  }

  getCurrentSessionSeconds(): number {
    if (!this.currentSession) {
      return 0;
    }
    return Math.floor(
      (Date.now() - this.currentSession.startedAt.getTime()) / 1000
    );
  }

  getActiveSessionInfo(): ActiveSessionInfo | null {
    if (!this.currentSession) {
      return null;
    }
    return {
      language: this.currentSession.language,
      projectName: this.currentSession.projectName,
      currentSeconds: this.getCurrentSessionSeconds(),
      startedAt: this.currentSession.startedAt.toISOString(),
    };
  }
}
