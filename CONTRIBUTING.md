# Contributing to GitAgora Extension

## Prerequisites

- Node.js 18+
- VS Code 1.85+
- npm

## Setup

```bash
git clone https://github.com/NotAProgrammer187/GitAgoraExtension.git
cd GitAgoraExtension
npm install
npm run build
```

## Development Workflow

### Building

```bash
npm run build        # One-time build
npm run watch        # Watch mode (rebuilds on changes)
```

### Type Checking

esbuild does not perform type checking. Always run this before committing:

```bash
npm run typecheck    # tsc --noEmit
```

### Linting & Formatting

```bash
npm run lint         # Check for lint errors
npm run lint:fix     # Auto-fix lint errors
npm run format       # Format code with Prettier
npm run format:check # Check formatting without writing
```

### Debugging

1. Open the project in VS Code
2. Press **F5** to launch the Extension Development Host
3. The extension will activate automatically in the new VS Code window
4. Check the Output panel (select "GitAgora") for logs

### Packaging

```bash
npm run package      # Creates a .vsix file
```

## Architecture

```
User Activity
     |
     v
  Tracker ──> SessionManager ──> HeartbeatSender ──> ApiClient ──> Server
                    |                                    ^
                    v                                    |
              PulseSender ───────────────────────────────┘
                                                         |
              StatusBar <────────────────────────────────┘
              SidebarProvider <───────────────────────────┘
```

### Data Flow

1. **Tracker** listens to VS Code editor events (typing, file changes, focus) and detects idle periods
2. **SessionManager** manages the current coding session — starts new sessions, ends them when the language/project changes or the user goes idle
3. **HeartbeatSender** queues completed sessions and sends them to the server in batches. Sessions are persisted to disk so they survive extension restarts
4. **PulseSender** sends a live "pulse" every 30 seconds with current session info (for real-time presence on the dashboard)
5. **ApiClient** handles all HTTP communication with the GitAgora server, using a token provider that fetches the GitHub OAuth token from VS Code on each request
6. **StatusBar** shows today's total coding time in the VS Code status bar
7. **SidebarProvider** renders the sidebar webview with stats, sign-in, and dashboard links

### Key Files

| File | Purpose |
|------|---------|
| `src/extension.ts` | Entry point — wires everything together |
| `src/tracker.ts` | VS Code event listeners + idle detection |
| `src/session-manager.ts` | Session lifecycle management |
| `src/heartbeat.ts` | Batched session sending with retry |
| `src/pulse.ts` | Real-time presence pings |
| `src/api-client.ts` | HTTP client for GitAgora API |
| `src/sidebar-provider.ts` | Webview sidebar UI |
| `src/status-bar.ts` | Status bar item |
| `src/config.ts` | Configuration reader |
| `src/storage.ts` | Persistent queue storage |
| `src/utils.ts` | Language normalization, time formatting |

## Code Conventions

- Use `import * as vscode from 'vscode'` (never `require('vscode')`)
- All classes that hold intervals/listeners should implement `vscode.Disposable`
- Webview HTML must include a Content Security Policy with a per-render nonce
- The GitHub OAuth token is never cached — it's fetched from VS Code's auth API on each request
- Error handling: use `console.error('[GitAgora] ...')` prefix for all log messages
