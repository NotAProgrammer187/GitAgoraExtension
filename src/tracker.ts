import * as vscode from 'vscode';
import { SessionManager } from './session-manager';
import { normalizeLanguage, getProjectName } from './utils';
import { getConfig } from './config';
import { IDLE_CHECK_INTERVAL_MS } from './constants';

/** Listens to VS Code editor events and manages session lifecycle via SessionManager. */
export class Tracker implements vscode.Disposable {
  private lastActivity = Date.now();
  private idleCheckInterval: ReturnType<typeof setInterval> | null = null;
  private isIdle = false;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly sessionManager: SessionManager,
    private readonly trackProjectNames: boolean
  ) {}

  start(): void {
    // Register VS Code event listeners
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(() => this.onActivity()),
      vscode.window.onDidChangeActiveTextEditor(() => this.onActivity()),
      vscode.workspace.onDidSaveTextDocument(() => this.onActivity()),
      vscode.window.onDidChangeTextEditorSelection(() => this.onActivity()),
      vscode.window.onDidChangeWindowState(state => {
        if (state.focused) {
          this.onActivity();
        }
      })
    );

    // Start idle detection timer
    this.idleCheckInterval = setInterval(() => this.checkIdle(), IDLE_CHECK_INTERVAL_MS);

    // Kick off with current editor if one is open
    this.onActivity();
  }

  private onActivity(): void {
    this.lastActivity = Date.now();

    if (this.isIdle) {
      // Returning from idle — new session will start below
      this.isIdle = false;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const language = normalizeLanguage(editor.document.languageId);
    const projectName = this.trackProjectNames ? getProjectName() : null;

    this.sessionManager.handleActivity(language, projectName);
  }

  private checkIdle(): void {
    const idleTimeout = getConfig().idleTimeout * 1000;
    const elapsed = Date.now() - this.lastActivity;

    if (!this.isIdle && elapsed >= idleTimeout) {
      this.isIdle = true;
      // End session at last activity time, not now
      const lastActivityTime = new Date(this.lastActivity);
      this.sessionManager.endSession(lastActivityTime);
    }
  }

  dispose(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
    // End any active session at the last activity timestamp
    if (this.sessionManager.hasActiveSession()) {
      this.sessionManager.endSession(new Date(this.lastActivity));
    }
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
