# Changelog

All notable changes to the GitAgora extension will be documented in this file.

## [0.2.0] - 2026-02-07

### Added

- Sidebar panel in the activity bar — see today's stats without opening the command palette
- Sign in/out directly from the sidebar
- Live stats display: today's coding time, session count, and top language
- Quick-access buttons to open the dashboard and leaderboard
- Custom SVG activity bar icon (code brackets + clock)

### Changed

- Activity bar icon switched from PNG to SVG for proper scaling

---

## [0.1.0] - 2025-02-07

### Added

- Automatic coding time tracking with idle detection
- Per-language session tracking (TypeScript, Python, Rust, Go, and 30+ languages)
- GitHub OAuth sign-in via VS Code's built-in authentication
- Status bar showing today's coding time
- Live pulse system for real-time leaderboard presence
- Offline queue — sessions are stored locally and retried when connectivity returns
- Commands: Sign In, Sign Out, Show Today's Stats, Open Dashboard
- Configurable idle timeout (default: 5 minutes)
- Option to disable project name tracking for privacy
- Zero runtime dependencies — single bundled file via esbuild
