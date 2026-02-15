import * as vscode from 'vscode';
import { getConfig, onConfigChange } from './config';
import { Storage } from './storage';
import { SessionManager } from './session-manager';
import { Tracker } from './tracker';
import { ApiClient } from './api-client';
import { HeartbeatSender } from './heartbeat';
import { PulseSender } from './pulse';
import { StatusBar } from './status-bar';
import { SidebarProvider } from './sidebar-provider';
import { formatTime } from './utils';
import { initLogger, logInfo, logError } from './logger';

const GITHUB_AUTH_SCOPES = ['user:email'];

let tracker: Tracker | undefined;
let heartbeatSender: HeartbeatSender | undefined;
let pulseSender: PulseSender | undefined;
let statusBar: StatusBar | undefined;
let sidebarProvider: SidebarProvider | undefined;

async function getGitHubToken(createIfNone: boolean): Promise<string | null> {
  try {
    const session = await vscode.authentication.getSession(
      'github',
      GITHUB_AUTH_SCOPES,
      { createIfNone }
    );
    return session?.accessToken ?? null;
  } catch {
    return null;
  }
}

async function getGitHubSession(createIfNone: boolean) {
  try {
    return await vscode.authentication.getSession(
      'github',
      GITHUB_AUTH_SCOPES,
      { createIfNone }
    );
  } catch {
    return null;
  }
}

async function signIn(apiClient: ApiClient, statusBar: StatusBar): Promise<boolean> {
  const session = await getGitHubSession(true);

  if (session) {
    statusBar.syncWithServer();
    sidebarProvider?.setSignedIn(session.account.label);
    vscode.window.showInformationMessage(
      `GitAgora: Signed in as ${session.account.label}`
    );
    return true;
  }
  return false;
}

async function trySilentSignIn(apiClient: ApiClient, statusBar: StatusBar): Promise<boolean> {
  const session = await getGitHubSession(false);

  if (session) {
    statusBar.syncWithServer();
    sidebarProvider?.setSignedIn(session.account.label);
    return true;
  }
  return false;
}

export async function activate(context: vscode.ExtensionContext) {
  const config = getConfig();

  // Initialize logger
  context.subscriptions.push(initLogger());
  logInfo('Activating GitAgora extension');

  // Initialize components
  const storage = new Storage(context.globalState);
  const sessionManager = new SessionManager();
  const apiClient = new ApiClient(config.apiUrl);

  // Set up token provider — fetches token from VS Code on each request
  apiClient.setTokenProvider(() => getGitHubToken(false));

  heartbeatSender = new HeartbeatSender(apiClient, storage);
  statusBar = new StatusBar(apiClient, sessionManager);

  // Register sidebar webview provider
  sidebarProvider = new SidebarProvider(context.extensionUri, apiClient, sessionManager);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, sidebarProvider)
  );

  // Register commands early so they're available as soon as the sidebar renders
  context.subscriptions.push(
    vscode.commands.registerCommand('gitagora.signIn', () =>
      signIn(apiClient, statusBar!)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitagora.signOut', async () => {
      sidebarProvider?.setSignedOut();
      vscode.window.showInformationMessage('GitAgora: Signed out.');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitagora.showTodayStats', async () => {
      if (!(await apiClient.isAuthenticated())) {
        const action = await vscode.window.showInformationMessage(
          'GitAgora: Sign in with GitHub to see your stats.',
          'Sign In'
        );
        if (action === 'Sign In') {
          await signIn(apiClient, statusBar!);
        }
        return;
      }

      const stats = await apiClient.getTodayStats();
      if (!stats) {
        vscode.window.showInformationMessage(
          'GitAgora: Unable to fetch stats. Check your connection.'
        );
        return;
      }

      const lines = [`Today: ${formatTime(stats.total_seconds)} total`];
      const langs = Object.entries(stats.languages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      for (const [lang, secs] of langs) {
        lines.push(`  ${lang}: ${formatTime(secs)}`);
      }
      lines.push(`Sessions: ${stats.sessions_count}`);

      vscode.window.showInformationMessage(lines.join('\n'), { modal: true });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitagora.openDashboard', () => {
      const dashboardUrl = getConfig().apiUrl;
      vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
    })
  );

  // When a session ends, enqueue it for sending and update status bar + sidebar
  sessionManager.setOnSessionEnd(session => {
    heartbeatSender!.enqueue(session);
    statusBar!.addCompletedSessionTime(session.duration_seconds);
    sidebarProvider?.refreshStats();
  });

  // Start tracker
  tracker = new Tracker(sessionManager, config.trackProjectNames);
  tracker.start();

  // Start heartbeat sender (loads persisted queue + starts flush interval) — non-blocking
  heartbeatSender.start().catch(err =>
    logError('HeartbeatSender start error', err)
  );

  // Start pulse sender (30-second live presence pings)
  pulseSender = new PulseSender(apiClient, sessionManager);
  pulseSender.start();

  // Start status bar updates
  statusBar.start();

  // Auth flow — fire-and-forget so activate() returns immediately
  // (allows resolveWebviewView to be called without blocking)
  void (async () => {
    try {
      const silentOk = await trySilentSignIn(apiClient, statusBar!);
      if (!silentOk) {
        const action = await vscode.window.showInformationMessage(
          'GitAgora: Sign in with GitHub to track your coding hours.',
          'Sign In'
        );
        if (action === 'Sign In') {
          await signIn(apiClient, statusBar!);
        }
      }
    } catch (err) {
      logError('Auth flow error', err);
    }
  })();

  // Listen for config changes
  context.subscriptions.push(
    onConfigChange(() => {
      const updated = getConfig();
      apiClient.updateConfig(updated.apiUrl);
    })
  );

  // Listen for auth session changes (sign in/out from other extensions)
  context.subscriptions.push(
    vscode.authentication.onDidChangeSessions(e => {
      if (e.provider.id === 'github') {
        trySilentSignIn(apiClient, statusBar!);
      }
    })
  );
}

export async function deactivate() {
  tracker?.dispose();
  pulseSender?.sendStop();
  pulseSender?.dispose();
  await heartbeatSender?.dispose();
  statusBar?.dispose();
}
