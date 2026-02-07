import * as vscode from 'vscode';
import { ApiClient, TodayStats } from './api-client';
import { SessionManager } from './session-manager';
import { formatTime } from './utils';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'gitagora-sidebar-view';

  private view?: vscode.WebviewView;
  private username: string = '';
  private lastStats?: TodayStats;
  private loading = false;

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
        case 'refresh':
          await this.refreshStats();
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

    this.loading = true;
    this.render(this.lastStats);

    const stats = await this.apiClient.getTodayStats();
    this.lastStats = stats ?? undefined;
    this.loading = false;
    this.render(this.lastStats);
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
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }
    .logo .accent {
      color: #39ff14;
    }
    .divider {
      width: 40px;
      height: 2px;
      background: #39ff14;
      opacity: 0.4;
      border-radius: 1px;
      margin-bottom: 16px;
    }
    .tagline {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      text-align: center;
      line-height: 1.6;
      margin-bottom: 28px;
      max-width: 200px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-family: var(--vscode-font-family);
      cursor: pointer;
      font-weight: 600;
      width: 100%;
      justify-content: center;
      transition: background 0.15s ease;
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
    .footer {
      margin-top: 20px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="logo">Git<span class="accent">Agora</span></div>
  <div class="divider"></div>
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
  <div class="footer">gitagora.xyz</div>
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

    const spinnerClass = this.loading ? 'spinning' : '';

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
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .logo .accent {
      color: #39ff14;
    }
    .refresh-btn {
      background: none;
      border: none;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      transition: color 0.15s ease;
    }
    .refresh-btn:hover {
      color: #39ff14;
    }
    .refresh-btn svg {
      width: 14px;
      height: 14px;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spinning svg {
      animation: spin 0.8s linear infinite;
    }
    .username {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      margin-bottom: 6px;
    }
    .divider {
      width: 40px;
      height: 2px;
      background: #39ff14;
      opacity: 0.4;
      border-radius: 1px;
      margin-bottom: 18px;
    }
    .stats {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: var(--vscode-editor-background);
      border-radius: 6px;
      border: 1px solid var(--vscode-widget-border, transparent);
      transition: border-color 0.15s ease;
    }
    .stat-row:hover {
      border-color: rgba(57, 255, 20, 0.2);
    }
    .stat-row.highlight {
      border-color: rgba(57, 255, 20, 0.15);
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
    .stat-value.large {
      font-size: 16px;
      text-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
    }
    .btn-group {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-family: var(--vscode-font-family);
      cursor: pointer;
      font-weight: 600;
      width: 100%;
      transition: background 0.15s ease;
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
    .footer {
      margin-top: 16px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Git<span class="accent">Agora</span></div>
    <button class="refresh-btn ${spinnerClass}" onclick="refresh()" title="Refresh stats">
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.45 2.55a7 7 0 1 0 .7 9.9l-1.2-1a5.5 5.5 0 1 1-.55-7.78L10.5 5.5H15V1l-1.55 1.55z"/>
      </svg>
    </button>
  </div>
  <div class="username">Signed in as ${this.escapeHtml(this.username)}</div>
  <div class="divider"></div>

  <div class="stats">
    <div class="stat-row highlight">
      <span class="stat-label">Today</span>
      <span class="stat-value large">${totalTime}</span>
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

  <div class="btn-group">
    <button class="btn btn-primary" onclick="openDashboard()">Open Dashboard</button>
    <button class="btn btn-secondary" onclick="openLeaderboard()">Leaderboard</button>
  </div>
  <div class="footer">gitagora.xyz</div>

  <script>
    const vscode = acquireVsCodeApi();
    function openDashboard() {
      vscode.postMessage({ command: 'openDashboard' });
    }
    function openLeaderboard() {
      vscode.postMessage({ command: 'openLeaderboard' });
    }
    function refresh() {
      vscode.postMessage({ command: 'refresh' });
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
