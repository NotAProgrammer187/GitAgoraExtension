# GitAgora Extension - Build Plan

## Overview
VS Code extension that tracks coding hours and programming languages, sending data to the GitAgora web app via API key authentication.

## Tech Stack
- TypeScript, VS Code Extension API
- esbuild (bundler)
- Zero runtime dependencies (Node.js built-in `fetch`)
- API key auth to GitAgora backend

## File Structure
```
GitAgoraExtension/
├── .vscodeignore
├── .gitignore
├── package.json          # Extension manifest
├── tsconfig.json
├── esbuild.js            # Build script
├── README.md
├── PRIVACY.md
├── LICENSE (MIT)
├── media/icon.png
└── src/
    ├── extension.ts      # activate/deactivate entry point
    ├── tracker.ts        # Event listeners, idle detection
    ├── heartbeat.ts      # Batch queue + HTTP sender
    ├── session-manager.ts # Session state management
    ├── api-client.ts     # HTTP client for GitAgora API
    ├── status-bar.ts     # Status bar "Xh Ym" display
    ├── config.ts         # Settings reader
    ├── storage.ts        # globalState persistence
    └── utils.ts          # Language detection, time formatting
```

## Features to Implement

### 1. Activity Tracking (`tracker.ts`)
Listen to VS Code events:
- `onDidChangeTextDocument` - Text edits
- `onDidChangeActiveTextEditor` - Tab switches
- `onDidSaveTextDocument` - File saves
- `onDidChangeTextEditorSelection` - Cursor movement
- `onDidChangeWindowState` - Focus changes

Each event should update the "last activity" timestamp and potentially start/end sessions.

### 2. Session Management (`session-manager.ts`)
- Track current session: `{ started_at, language, project_name }`
- **New session** when: language changes, project changes, or return from idle
- **End session** at last activity timestamp (not current time)
- **Minimum session duration**: 30 seconds (discard shorter sessions)
- Store ended sessions in a queue for batch sending

### 3. Idle Detection (`tracker.ts`)
- Default timeout: 5 minutes (300 seconds), configurable via settings
- Use a periodic timer (every 30 seconds) to check if `Date.now() - lastActivity > idleTimeout`
- When idle detected, end current session at `lastActivity` timestamp
- When activity resumes after idle, start a new session

### 4. Heartbeat Batching (`heartbeat.ts`)
- Maintain a queue of completed sessions
- **Flush every 2 minutes** via `setInterval`
- Also flush on deactivate (extension shutdown)
- Send batch via `POST {apiUrl}/api/heartbeat`
- Headers: `Authorization: Bearer {apiKey}`, `Content-Type: application/json`
- Body format:
```json
{
  "sessions": [
    {
      "started_at": "2024-01-15T10:00:00.000Z",
      "ended_at": "2024-01-15T10:30:00.000Z",
      "duration_seconds": 1800,
      "language": "typescript",
      "project_name": "my-project"
    }
  ]
}
```

### 5. Offline Resilience (`storage.ts`)
- If heartbeat POST fails (network error, server down), keep sessions in queue
- Persist unsent heartbeats in `context.globalState` so they survive VS Code restarts
- On extension activate, load persisted queue and attempt to flush
- On successful flush, clear persisted data

### 6. Status Bar (`status-bar.ts`)
- Display today's coding time: `$(clock) 2h 34m` (using VS Code codicon)
- Position: left side, priority 100
- Click action: run "Show Today's Stats" command
- Update every 60 seconds
- Sync with server on startup via `GET {apiUrl}/api/heartbeat?today=true`
- Add local session time on top of server time for real-time feel
- Tooltip: "GitAgora: Today's coding time"

### 7. API Client (`api-client.ts`)
- `sendHeartbeats(sessions[])` - POST to /api/heartbeat
- `getTodayStats()` - GET /api/heartbeat?today=true
- Handle HTTP errors gracefully (log, don't throw)
- Use Node.js built-in `fetch` (no axios/node-fetch)
- Timeout: 30 seconds per request

### 8. Configuration (`config.ts`)
Read from VS Code settings (`vscode.workspace.getConfiguration('gitagora')`):
- `apiKey`: string (empty default) - stored in `context.secrets` (encrypted)
- `apiUrl`: string (default: `https://gitagora.dev`) - base URL for API
- `idleTimeout`: number (default: 300) - seconds before idle
- `trackProjectNames`: boolean (default: true) - whether to send project names
- Listen for config changes and update behavior accordingly

### 9. Commands
Register these commands in package.json `contributes.commands`:
- `gitagora.setApiKey` - Prompt for API key, store in `context.secrets`
- `gitagora.showTodayStats` - Show notification with today's stats breakdown
- `gitagora.openDashboard` - Open GitAgora dashboard in browser

### 10. Extension Entry Point (`extension.ts`)
```
activate(context):
  1. Read config
  2. Load persisted heartbeat queue from globalState
  3. Initialize SessionManager
  4. Initialize Tracker (register event listeners)
  5. Initialize HeartbeatSender (start flush interval)
  6. Initialize StatusBar
  7. Register commands
  8. If API key is set, sync today's stats from server

deactivate():
  1. End current session (if any)
  2. Flush all pending heartbeats (best effort)
  3. Persist any remaining unsent heartbeats
  4. Dispose all listeners/intervals
```

## package.json Manifest

### Key Fields
```json
{
  "name": "gitagora",
  "displayName": "GitAgora",
  "description": "Track your coding hours and compete on the leaderboard",
  "version": "0.1.0",
  "publisher": "gitagora",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [...],
    "configuration": {
      "title": "GitAgora",
      "properties": {
        "gitagora.apiUrl": { "type": "string", "default": "https://gitagora.dev" },
        "gitagora.idleTimeout": { "type": "number", "default": 300 },
        "gitagora.trackProjectNames": { "type": "boolean", "default": true }
      }
    }
  }
}
```

Note: `apiKey` is NOT in contributes.configuration - it's stored in `context.secrets` for security.

### Scripts
```json
{
  "vscode:prepublish": "npm run build",
  "build": "node esbuild.js",
  "watch": "node esbuild.js --watch",
  "package": "npx @vscode/vsce package"
}
```

## esbuild Configuration (`esbuild.js`)
```javascript
const esbuild = require('esbuild');
const isWatch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
};

if (isWatch) {
  esbuild.context(config).then(ctx => ctx.watch());
} else {
  esbuild.build(config);
}
```

## Language Detection (`utils.ts`)
Use `document.languageId` from VS Code (already normalized). Map common ones:
- `typescriptreact` -> `tsx`
- `javascriptreact` -> `jsx`
- `plaintext` -> `text`
- Everything else: use as-is (e.g., `typescript`, `python`, `rust`)

## Implementation Order
1. `package.json` + `tsconfig.json` + `esbuild.js` + `.gitignore` + `.vscodeignore`
2. `src/config.ts` + `src/utils.ts` (foundations)
3. `src/storage.ts` (persistence layer)
4. `src/session-manager.ts` (session logic)
5. `src/tracker.ts` (VS Code event listeners)
6. `src/api-client.ts` (HTTP client)
7. `src/heartbeat.ts` (batch sender)
8. `src/status-bar.ts` (UI)
9. `src/extension.ts` (wire everything together)
10. `README.md` + `PRIVACY.md` + `LICENSE`
11. Test with Extension Development Host

## API Contract with GitAgora Web App

### POST /api/heartbeat
**Request:**
```
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "sessions": [{
    "started_at": "ISO8601",
    "ended_at": "ISO8601",
    "duration_seconds": number,
    "language": "string",
    "project_name": "string | null"
  }]
}
```
**Response:** `200 { inserted: number }` or `401 { error: "..." }`

### GET /api/heartbeat?today=true
**Request:**
```
Authorization: Bearer <api-key>
```
**Response:**
```json
{
  "total_seconds": 3600,
  "languages": { "typescript": 2400, "python": 1200 },
  "sessions_count": 5
}
```
