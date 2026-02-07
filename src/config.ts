import * as vscode from 'vscode';

export interface GitAgoraConfig {
  apiUrl: string;
  idleTimeout: number;
  trackProjectNames: boolean;
}

export function getConfig(): GitAgoraConfig {
  const cfg = vscode.workspace.getConfiguration('gitagora');
  return {
    apiUrl: cfg.get<string>('apiUrl', 'http://localhost:3000').replace(/\/+$/, ''), //using localhost first (development) will branch to our production url later :))
    idleTimeout: cfg.get<number>('idleTimeout', 300),
    trackProjectNames: cfg.get<boolean>('trackProjectNames', true),
  };
}

export function onConfigChange(callback: () => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('gitagora')) {
      callback();
    }
  });
}
