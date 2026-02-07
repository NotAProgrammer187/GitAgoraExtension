import * as vscode from 'vscode';
import { Session } from './session-manager';

const STORAGE_KEY = 'gitagora.pendingHeartbeats';

export class Storage {
  constructor(private readonly state: vscode.Memento) {}

  loadPendingSessions(): Session[] {
    return this.state.get<Session[]>(STORAGE_KEY, []);
  }

  async savePendingSessions(sessions: Session[]): Promise<void> {
    await this.state.update(STORAGE_KEY, sessions);
  }

  async clearPendingSessions(): Promise<void> {
    await this.state.update(STORAGE_KEY, []);
  }
}
