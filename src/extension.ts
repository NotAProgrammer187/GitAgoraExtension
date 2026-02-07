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

const GITHUB_AUTH_SCOPES = ['user:email'];

let tracker: Tracker | undefined;
let heartbeatSender: HeartbeatSender | undefined;
let pulseSender: PulseSender | undefined;
let statusBar: StatusBar | undefined;
let sidebarProvider: SidebarProvider | undefined;

async function signIn(apiClient: ApiClient, statusBar: StatusBar): Promise<boolean> {
  try {
    const session = await vscode.authentication.getSession(
      'github',
      GITHUB_AUTH_SCOPES,
      { createIfNone: true }
    );

    if (session) {
      apiClient.setToken(session.accessToken);
      statusBar.syncWithServer();
      sidebarProvider?.setSignedIn(session.account.label);
      vscode.window.showInformationMessage(
        `GitAgora: Signed in as ${session.account.label}`
      );
      return true;
    }
  } catch {
    // User cancelled the sign-in prompt
  }
  return false;
}

async function trySilentSignIn(apiClient: ApiClient, statusBar: StatusBar): Promise<boolean> {
  try {
    const session = await vscode.authentication.getSession(
      'github',
      GITHUB_AUTH_SCOPES,
      { createIfNone: false }
    );

    if (session) {
      apiClient.setToken(session.accessToken);
      statusBar.syncWithServer();
      sidebarProvider?.setSignedIn(session.account.label);
      return true;
    }
  } catch {
    // No existing session, that's fine
  }
  return false;
}

export async function activate(context: vscode.ExtensionContext) {
  const config = getConfig();

  // Initialize components
  const storage = new Storage(context.globalState);
  const sessionManager = new SessionManager();
  const apiClient = new ApiClient(config.apiUrl);
  heartbeatSender = new HeartbeatSender(apiClient, storage);
  statusBar = new StatusBar(apiClient, sessionManager);

  // Register sidebar webview provider
  sidebarProvider = new SidebarProvider(context.extensionUri, apiClient, sessionManager);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, sidebarProvider)
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

  // Start heartbeat sender (loads persisted queue + starts flush interval)
  await heartbeatSender.start();

  // Start pulse sender (30-second live presence pings)
  pulseSender = new PulseSender(apiClient, sessionManager);
  pulseSender.start();

  // Start status bar updates
  statusBar.start();

  // Try to silently restore an existing GitHub session (no prompt)
  const silentOk = await trySilentSignIn(apiClient, statusBar);

  // If not signed in, show a popup prompting the user
  if (!silentOk) {
    const action = await vscode.window.showInformationMessage(
      'GitAgora: Sign in with GitHub to track your coding hours.',
      'Sign In'
    );
    if (action === 'Sign In') {
      await signIn(apiClient, statusBar);
    }
  }

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

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('gitagora.signIn', () =>
      signIn(apiClient, statusBar!)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitagora.signOut', async () => {
      apiClient.setToken('');
      sidebarProvider?.setSignedOut();
      vscode.window.showInformationMessage('GitAgora: Signed out.');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('gitagora.showTodayStats', async () => {
      if (!apiClient.isAuthenticated()) {
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
}

export async function deactivate() {
  tracker?.dispose();
  pulseSender?.sendStop();
  pulseSender?.dispose();
  await heartbeatSender?.dispose();
  statusBar?.dispose();
}
