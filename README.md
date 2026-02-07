<p align="center">
  <img src="https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="VS Code Extension" />
  <img src="https://img.shields.io/badge/Version-0.1.0-00ff41?style=for-the-badge&logo=semver&logoColor=white" alt="Version" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="License" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Dependencies-Zero-success?style=for-the-badge&logo=npm&logoColor=white" alt="Zero Dependencies" />
</p>

<h1 align="center">GitAgora</h1>

<p align="center">
  <strong>Track your coding hours. Compete on the leaderboard. See how you stack up.</strong>
</p>

<p align="center">
  A lightweight VS Code extension that tracks how long you code — broken down by language and session.<br/>
  Syncs with <a href="https://www.gitagora.xyz">GitAgora</a> so you can see your stats on a dashboard and compete with other developers.
</p>

---

## Features

- **Auto Time Tracking** — Starts when you type, ends when you're idle. Zero effort.
- **Per-Language Stats** — TypeScript, Python, Rust — every language tracked separately.
- **Status Bar** — See today's total coding time right in VS Code.
- **Leaderboard** — Compete with friends. Climb the ranks.
- **Live Presence** — Shows who's actively coding on the leaderboard in real time.
- **Offline Support** — Sessions saved locally and synced when you're back online.

---

## Privacy & Security

> **We don't read your code. We don't touch your files. We don't track what you type.**

### What We Collect

| Data | Description | Opt-out? |
|------|-------------|----------|
| Language | The VS Code language ID (e.g. `typescript`, `python`) | No (core feature) |
| Duration | How long the session lasted | No (core feature) |
| Timestamps | When the session started and ended | No (core feature) |
| Project name | Your workspace folder name | Yes — set `gitagora.trackProjectNames` to `false` |

### What We Don't

- We **never** read your source code — not a single line, not a single character
- We **never** access your file contents or file names
- We **never** log keystrokes or clipboard data
- We **never** access your GitHub repos, issues, or private data
- We **never** send git diffs, repo URLs, or browsing history
- We **never** run in the background after VS Code is closed

### The Actual Payload

Every 2 minutes, this is **exactly** what gets sent — nothing more, nothing less:

```json
{
  "language": "typescript",
  "project_name": "my-project",
  "started_at": "2025-01-15T10:30:00.000Z",
  "ended_at": "2025-01-15T10:35:00.000Z",
  "duration_seconds": 300
}
```

### Authentication

We use **VS Code's built-in GitHub OAuth**. The token is scoped to read your **public profile only** (username and avatar). We never see your GitHub password and cannot access your repositories.

---

## Quick Start

### Install from VSIX

```bash
git clone https://github.com/NotAProgrammer187/GitAgoraExtension.git
cd GitAgoraExtension
npm install && npm run build && npm run package
code --install-extension gitagora-0.1.0.vsix
```

### Run from Source

```bash
git clone https://github.com/NotAProgrammer187/GitAgoraExtension.git
cd GitAgoraExtension
npm install
npm run watch
```

Press **F5** in VS Code to launch the Extension Development Host.

---

## Configuration

Open VS Code settings (`Ctrl+,`) and search for `gitagora`:

| Setting | Default | Description |
|---------|---------|-------------|
| `gitagora.apiUrl` | `https://www.gitagora.xyz/` | The GitAgora API URL |
| `gitagora.idleTimeout` | `300` (5 min) | Seconds of inactivity before a session ends |
| `gitagora.trackProjectNames` | `true` | Send workspace folder names to GitAgora |

---

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `GitAgora: Sign In with GitHub` | Authenticate with your GitHub account |
| `GitAgora: Sign Out` | Remove your authentication |
| `GitAgora: Show Today's Stats` | See a summary of today's coding time |
| `GitAgora: Open Dashboard` | Open your dashboard in the browser |

---

## How It Works

```
  You write code
       │
       ▼
  Tracker detects activity (text changes, tab switches, scrolling)
       │
       ▼
  SessionManager tracks the session (language + duration)
       │
       ▼
  After 5 min idle, the session ends at your last activity timestamp
       │
       ▼
  HeartbeatSender batches sessions and sends every 2 minutes
       │
       ▼
  GitAgora API stores: language, duration, timestamps — that's all
       │
       ▼
  Your stats appear on the dashboard and leaderboard
```

**Idle Detection** — Checks for activity every 30 seconds. After 5 minutes of no input, the session ends at your last activity timestamp. Idle time is never counted.

**Offline Mode** — If the API is unreachable, sessions are persisted in VS Code's local storage and automatically synced when the connection is restored.

**Live Presence** — A lightweight 30-second pulse shows who's actively coding on the leaderboard. Failures are silently ignored.

---

## Architecture

```
src/
├── extension.ts .......... Entry point — wires everything together
├── tracker.ts ............ Listens to VS Code events, detects idle
├── session-manager.ts .... Manages session state and lifecycle
├── heartbeat.ts .......... Batches and sends completed sessions
├── pulse.ts .............. 30-second live presence pings
├── api-client.ts ......... HTTP client for the GitAgora API
├── status-bar.ts ......... Status bar display
├── config.ts ............. Reads VS Code settings
├── storage.ts ............ Persists unsent sessions for offline support
└── utils.ts .............. Language normalization, time formatting
```

Zero runtime dependencies. The extension uses only Node.js built-in `fetch` and the VS Code API. The entire bundle is a single `dist/extension.js` file.

---

## Contributing

Contributions are welcome. Here's how to get started:

### Setup

```bash
git clone https://github.com/NotAProgrammer187/GitAgoraExtension.git
cd GitAgoraExtension
npm install
npm run watch
```

Press **F5** to launch the Extension Development Host.

### Build & Package

```bash
npm run build          # One-time build
npm run package        # Create .vsix file
```

### Guidelines

- **Keep it lightweight.** This runs in the background — minimal CPU and memory.
- **Never access file contents.** The extension intentionally ignores source code. Don't change this.
- **Zero runtime deps.** Use Node.js built-ins and the VS Code API only.
- **Privacy first.** New data collection must be opt-in and documented.
- **Test with F5.** Always test in the Extension Development Host before submitting.

---

## Tech Stack

<p>
  <img src="https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/esbuild-Bundler-FFCF00?style=flat-square&logo=esbuild&logoColor=black" />
  <img src="https://img.shields.io/badge/VS%20Code%20API-%5E1.85.0-007ACC?style=flat-square&logo=visual-studio-code&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Built--in%20Fetch-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Runtime%20Deps-0-00ff41?style=flat-square" />
</p>

---

## License

This project is licensed under the [MIT License](LICENSE).
