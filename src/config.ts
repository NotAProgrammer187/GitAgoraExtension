import * as vscode from 'vscode';
import { GitAgoraConfig } from './types';

export type { GitAgoraConfig };

export function getConfig(): GitAgoraConfig {
  const cfg = vscode.workspace.getConfiguration('gitagora');
  return {
    apiUrl: cfg.get<string>('apiUrl', 'https://www.gitagora.xyz/').replace(/\/+$/, ''),
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
