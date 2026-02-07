# GitAgora

Track your coding hours. Compete on the leaderboard. See how you stack up.

A lightweight VS Code extension that automatically tracks how long you code — broken down by language and session. Your stats sync to [gitagora.xyz](https://www.gitagora.xyz) where you can view your dashboard and compete with other developers.

## Features

- **Auto Time Tracking** — Starts when you type, pauses when you're idle. Zero effort.
- **Per-Language Stats** — TypeScript, Python, Rust, Go — every language tracked separately.
- **Status Bar** — See today's total coding time right in the bottom bar.
- **Leaderboard** — Compete with other developers. Climb the ranks.
- **Live Presence** — Shows who's actively coding on the leaderboard in real time.
- **Offline Support** — Sessions are saved locally and synced when you're back online.

## Getting Started

1. Install the extension
2. Open the Command Palette (`Ctrl+Shift+P`) and run **GitAgora: Sign In with GitHub**
3. Start coding — your time is tracked automatically

Your stats will appear on your [GitAgora Dashboard](https://www.gitagora.xyz/dashboard).

## Commands

| Command | Description |
|---------|-------------|
| `GitAgora: Sign In with GitHub` | Sign in to start tracking |
| `GitAgora: Sign Out` | Sign out of your account |
| `GitAgora: Show Today's Stats` | View today's coding time breakdown |
| `GitAgora: Open Dashboard` | Open the web dashboard |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `gitagora.idleTimeout` | `300` (5 min) | Seconds of inactivity before tracking pauses |
| `gitagora.trackProjectNames` | `true` | Include workspace folder names in your stats |

## Privacy

GitAgora only tracks **language**, **duration**, and optionally **project name**. We never read your code, file contents, or file paths. The extension is [open source](https://github.com/NotAProgrammer187/GitAgoraExtension).

## Links

- [Website](https://www.gitagora.xyz)
- [Leaderboard](https://www.gitagora.xyz/leaderboard)
- [Report an Issue](https://github.com/NotAProgrammer187/GitAgoraExtension/issues)
