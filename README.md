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
  Syncs with <a href="https://gitagora.com">GitAgora</a> so you can see your stats on a dashboard and compete with other developers.
</p>

---

## Features

| | Feature | Description |
|---|---------|-------------|
| :stopwatch: | **Auto Time Tracking** | Starts when you type, ends when you're idle. Zero effort. |
| :bar_chart: | **Per-Language Stats** | TypeScript, Python, Rust — every language tracked separately. |
| :desktop_computer: | **Status Bar** | See today's total coding time right in VS Code. |
| :trophy: | **Leaderboard** | Compete with friends. Climb the ranks. |
| :green_circle: | **Live Presence** | Green dot on the leaderboard when you're actively coding. |
| :signal_strength: | **Offline Support** | Sessions saved locally and synced when you're back online. |

---

## :lock: Privacy & Security

> **TL;DR — We don't read your code. We don't touch your files. We don't track what you type.**

### :white_check_mark: What We DO

| Data | Description | Opt-out? |
|------|-------------|----------|
| Language | The VS Code language ID (e.g. `typescript`, `python`) | No (core feature) |
| Duration | How long the session lasted | No (core feature) |
| Timestamps | When the session started and ended | No (core feature) |
| Project name | Your workspace folder name | :white_check_mark: Yes — set `gitagora.trackProjectNames` to `false` |

### :no_entry_sign: What We DON'T

| | We never... |
|---|-------------|
| :x: | Read your source code — not a single line, not a single character |
| :x: | Access your file contents or file names |
| :x: | Log keystrokes or clipboard data |
| :x: | Access your GitHub repos, issues, or private data |
| :x: | Send git diffs, repo URLs, or browsing history |
| :x: | Run in the background after VS Code is closed |

### :page_facing_up: The Actual Payload

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

### :key: Authentication

We use **VS Code's built-in GitHub OAuth**. The token is scoped to read your **public profile only** (username + avatar). We never see your GitHub password and cannot access your repositories.

---

## :rocket: Quick Start

### Install from VSIX

```bash
git clone https://github.com/yourusername/GitAgoraExtension.git
cd GitAgoraExtension
npm install && npm run build && npm run package
code --install-extension gitagora-0.1.0.vsix
```

### Run from Source

```bash
git clone https://github.com/yourusername/GitAgoraExtension.git
cd GitAgoraExtension
npm install
npm run watch
```

Press **F5** in VS Code to launch the Extension Development Host.

---

## :gear: Configuration

Open VS Code settings (`Ctrl+,`) and search for `gitagora`:

| Setting | Default | Description |
|---------|---------|-------------|
| `gitagora.apiUrl` | `http://localhost:3000` | The GitAgora API URL |
| `gitagora.idleTimeout` | `300` (5 min) | Seconds of inactivity before a session ends |
| `gitagora.trackProjectNames` | `true` | Send workspace folder names to GitAgora |

---

## :keyboard: Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `GitAgora: Sign In with GitHub` | :key: Authenticate with your GitHub account |
| `GitAgora: Sign Out` | :door: Remove your authentication |
| `GitAgora: Show Today's Stats` | :bar_chart: See a summary of today's coding time |
| `GitAgora: Open Dashboard` | :globe_with_meridians: Open your dashboard in the browser |

---

## :building_construction: How It Works

```
  +-------------------+
  |  You write code   |
  +--------+----------+
           |
           v
  +-------------------+
  |  Tracker detects   |  Text changes, tab switches,
  |  activity          |  scrolling, focus changes
  +--------+----------+
           |
           v
  +-------------------+
  |  SessionManager    |  Tracks language + duration
  |  manages session   |  Ends on idle (5 min default)
  +--------+----------+
           |
           v
  +-------------------+
  |  HeartbeatSender   |  Batches sessions every 2 min
  |  sends to API      |  Retries on failure
  +--------+----------+
           |
           v
  +-------------------+
  |  GitAgora API      |  Stores: language, duration,
  |  receives data     |  timestamps. That's all.
  +--------+----------+
           |
           v
  +-------------------+
  |  Dashboard &       |
  |  Leaderboard       |
  +-------------------+
```

### :zzz: Idle Detection

Checks for activity every 30 seconds. After 5 minutes of no input, the session ends at your **last activity timestamp** — idle time is never counted.

### :satellite: Offline Mode

If the API is unreachable, sessions are persisted in VS Code's local storage and automatically synced when the connection is restored. No data is ever lost.

### :green_circle: Live Presence

A lightweight 30-second pulse shows who's actively coding on the leaderboard. Sends minimal data (language + current duration). Fire-and-forget — failures are silently ignored.

---

## :file_folder: Architecture

```
src/
├── extension.ts .......... Entry point — wires everything together
├── tracker.ts ............ Listens to VS Code events, detects idle
├── session-manager.ts .... Manages session state and lifecycle
├── heartbeat.ts .......... Batches and sends completed sessions
├── pulse.ts .............. 30-second live presence pings
├── api-client.ts ......... HTTP client for the GitAgora API
├── status-bar.ts ......... "Xh Ym" display in the status bar
├── config.ts ............. Reads VS Code settings
├── storage.ts ............ Persists unsent sessions for offline support
└── utils.ts .............. Language normalization, time formatting
```

---

## :handshake: Contributing

Contributions are welcome! Here's how to get started:

### Setup

```bash
git clone https://github.com/yourusername/GitAgoraExtension.git
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

| | Rule |
|---|------|
| :feather: | **Keep it lightweight.** This runs in the background — minimal CPU and memory. |
| :no_entry: | **Never access file contents.** The extension intentionally ignores source code. Don't change this. |
| :package: | **Zero runtime deps.** Use Node.js built-ins and the VS Code API only. |
| :shield: | **Privacy first.** New data collection must be opt-in and documented. |
| :test_tube: | **Test with F5.** Always test in the Extension Development Host before submitting. |

---

## :hammer_and_wrench: Tech Stack

<p>
  <img src="https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/esbuild-Bundler-FFCF00?style=flat-square&logo=esbuild&logoColor=black" />
  <img src="https://img.shields.io/badge/VS%20Code%20API-%5E1.85.0-007ACC?style=flat-square&logo=visual-studio-code&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Built--in%20Fetch-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Runtime%20Deps-0-00ff41?style=flat-square" />
</p>

---

## :page_facing_up: License

MIT — do whatever you want with it.

---

<p align="center">
  <sub>Built with :green_heart: by the GitAgora community</sub>
</p>
