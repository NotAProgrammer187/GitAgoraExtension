import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;

/** Initialize the shared output channel. Call once during activation. */
export function initLogger(): vscode.OutputChannel {
  outputChannel = vscode.window.createOutputChannel('GitAgora');
  return outputChannel;
}

/** Log an informational message to the GitAgora output channel. */
export function logInfo(message: string): void {
  const line = `[${new Date().toISOString()}] ${message}`;
  outputChannel?.appendLine(line);
}

/** Log an error to the GitAgora output channel and console. */
export function logError(message: string, error?: unknown): void {
  const line = `[${new Date().toISOString()}] ERROR: ${message}`;
  outputChannel?.appendLine(line);
  if (error) {
    const errorStr = error instanceof Error ? error.stack ?? error.message : String(error);
    outputChannel?.appendLine(`  ${errorStr}`);
  }
  console.error(`[GitAgora] ${message}`, error ?? '');
}
