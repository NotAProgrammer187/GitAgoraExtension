import * as vscode from 'vscode';
import { ApiClient, TodayStats } from './api-client';
import { SessionManager } from './session-manager';
import { formatTime } from './utils';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'gitagora-sidebar-view';

  private view?: vscode.WebviewView;
  private username: string = '';

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly apiClient: ApiClient,
    private readonly sessionManager: SessionManager,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'signIn':
          await vscode.commands.executeCommand('gitagora.signIn');
          break;
        case 'openDashboard':
          await vscode.commands.executeCommand('gitagora.openDashboard');
          break;
        case 'openLeaderboard':
          await vscode.commands.executeCommand('gitagora.openDashboard');
          break;
      }
    });

    this.render();
  }

  /** Called by extension.ts when auth state changes */
  setSignedIn(username: string): void {
    this.username = username;
    this.render();
    this.refreshStats();
  }

  setSignedOut(): void {
    this.username = '';
    this.render();
  }

  /** Fetch latest stats from server and re-render */
  async refreshStats(): Promise<void> {
    if (!this.apiClient.isAuthenticated()) {
      this.render();
      return;
    }

    const stats = await this.apiClient.getTodayStats();
    this.render(stats ?? undefined);
  }

  /** Push updated local time to the sidebar (called on session end, timer tick) */
  updateLocalTime(): void {
    if (!this.apiClient.isAuthenticated()) {
      return;
    }
    // Quick re-render with no server fetch — just refresh the view
    // We'll do a lightweight render using cached data concept
    // For simplicity, trigger a full stats refresh
    this.refreshStats();
  }

  private render(stats?: TodayStats): void {
    if (!this.view) {
      return;
    }

    const isSignedIn = this.apiClient.isAuthenticated() && this.username;
    this.view.webview.html = isSignedIn
      ? this.getSignedInHtml(stats)
      : this.getSignedOutHtml();
  }

  private getSignedOutHtml(): string {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .logo .accent {
      color: #39ff14;
    }
    .tagline {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      text-align: center;
      line-height: 1.5;
      margin-bottom: 24px;
      max-width: 200px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-family: var(--vscode-font-family);
      cursor: pointer;
      font-weight: 600;
      width: 100%;
      justify-content: center;
    }
    .btn-primary {
      background: #39ff14;
      color: #0a0a0a;
    }
    .btn-primary:hover {
      background: #32e612;
    }
    .gh-icon {
      width: 16px;
      height: 16px;
    }
  </style>
</head>
<body>
  <div class="logo">Git<span class="accent">Agora</span></div>
  <p class="tagline">Track your coding hours.<br>Compete on the leaderboard.</p>
  <button class="btn btn-primary" onclick="signIn()">
    <svg class="gh-icon" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
        -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87
        2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
        0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0
        .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09
        2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08
        2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65
        3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01
        2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
    Sign in with GitHub
  </button>
  <script>
    const vscode = acquireVsCodeApi();
    function signIn() {
      vscode.postMessage({ command: 'signIn' });
    }
  </script>
</body>
</html>`;
  }

  private getSignedInHtml(stats?: TodayStats): string {
    const totalTime = stats ? formatTime(stats.total_seconds) : '--';
    const sessionCount = stats?.sessions_count?.toString() ?? '--';

    let topLang = '--';
    if (stats && Object.keys(stats.languages).length > 0) {
      const sorted = Object.entries(stats.languages).sort(([, a], [, b]) => b - a);
      topLang = sorted[0][0];
    }

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .logo .accent {
      color: #39ff14;
    }
    .username {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      margin-bottom: 20px;
    }
    .stats {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--vscode-editor-background);
      border-radius: 6px;
      border: 1px solid var(--vscode-widget-border, transparent);
    }
    .stat-label {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .stat-value {
      font-size: 14px;
      font-weight: 600;
      color: #39ff14;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 7px 16px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-family: var(--vscode-font-family);
      cursor: pointer;
      font-weight: 600;
      width: 100%;
      margin-bottom: 8px;
    }
    .btn-primary {
      background: #39ff14;
      color: #0a0a0a;
    }
    .btn-primary:hover {
      background: #32e612;
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
  </style>
</head>
<body>
  <div class="logo">Git<span class="accent">Agora</span></div>
  <div class="username">Signed in as ${this.escapeHtml(this.username)}</div>

  <div class="stats">
    <div class="stat-row">
      <span class="stat-label">Today</span>
      <span class="stat-value">${totalTime}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Sessions</span>
      <span class="stat-value">${sessionCount}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Top Language</span>
      <span class="stat-value">${this.escapeHtml(topLang)}</span>
    </div>
  </div>

  <button class="btn btn-primary" onclick="openDashboard()">Open Dashboard</button>
  <button class="btn btn-secondary" onclick="openLeaderboard()">Leaderboard</button>

  <script>
    const vscode = acquireVsCodeApi();
    function openDashboard() {
      vscode.postMessage({ command: 'openDashboard' });
    }
    function openLeaderboard() {
      vscode.postMessage({ command: 'openLeaderboard' });
    }
  </script>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
