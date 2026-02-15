import * as vscode from 'vscode';
import { ApiClient } from './api-client';
import { SessionManager } from './session-manager';
import { formatTime } from './utils';
import { STATUS_BAR_UPDATE_INTERVAL_MS } from './constants';

/** Shows today's total coding time in the VS Code status bar. */
export class StatusBar implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private serverSeconds = 0;

  constructor(
    private readonly apiClient: ApiClient,
    private readonly sessionManager: SessionManager
  ) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.item.command = 'gitagora.showTodayStats';
    this.item.tooltip = "GitAgora: Today's coding time";
    this.item.show();
  }

  /** Fetch the latest stats from the server and update the display. */
  async syncWithServer(): Promise<void> {
    const stats = await this.apiClient.getTodayStats();
    if (stats) {
      this.serverSeconds = stats.total_seconds;
    }
    this.render();
  }

  start(): void {
    this.render();
    this.updateInterval = setInterval(() => this.render(), STATUS_BAR_UPDATE_INTERVAL_MS);
  }

  private render(): void {
    const localSeconds = this.sessionManager.getCurrentSessionSeconds();
    const totalSeconds = this.serverSeconds + localSeconds;
    this.item.text = `$(clock) ${formatTime(totalSeconds)}`;
  }

  /** Add locally completed session time to the running total. */
  addCompletedSessionTime(seconds: number): void {
    this.serverSeconds += seconds;
    this.render();
  }

  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.item.dispose();
  }
}
