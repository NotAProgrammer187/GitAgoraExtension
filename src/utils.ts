const languageMap: Record<string, string> = {
  typescriptreact: 'tsx',
  javascriptreact: 'jsx',
  plaintext: 'text',
  jsonc: 'json',
  shellscript: 'bash',
  dockercompose: 'yaml',
};

export function normalizeLanguage(languageId: string): string {
  return languageMap[languageId] ?? languageId;
}

export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getProjectName(): string | null {
  const folders = require('vscode').workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return null;
  }
  return folders[0].name;
}
