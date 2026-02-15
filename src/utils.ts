import * as vscode from 'vscode';

const languageMap: Record<string, string> = {
  typescriptreact: 'tsx',
  javascriptreact: 'jsx',
  plaintext: 'text',
  jsonc: 'json',
  shellscript: 'bash',
  dockercompose: 'yaml',
};

/** Map VS Code language IDs to shorter display names. */
export function normalizeLanguage(languageId: string): string {
  return languageMap[languageId] ?? languageId;
}

/** Format seconds into a human-readable duration string (e.g. "2h 15m"). */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/** Get the name of the first workspace folder, or null if none. */
export function getProjectName(): string | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return null;
  }
  return folders[0].name;
}
