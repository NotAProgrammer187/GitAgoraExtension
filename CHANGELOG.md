# Changelog

All notable changes to the GitAgora extension will be documented in this file.

## [0.2.4] - 2026-02-08

### Fixed

- "Today" stats now use the user's local timezone instead of UTC — previously showed yesterday's sessions after midnight for users west of UTC
- Extension sends `tz_offset` parameter so the server computes the correct day boundaries per-user

---

## [0.2.3] - 2026-02-07

### Fixed

- Fixed blank sidebar when not logged into GitHub — sidebar now renders sign-in screen immediately
- Made auth flow non-blocking so `activate()` returns before user interacts with sign-in prompt
- Moved command registrations before async work so `gitagora.signIn` is available when sidebar renders
- Made heartbeat sender start non-blocking to prevent activation delays
- Added defensive error handling in sidebar renderer with branded fallback page

---

## [0.2.2] - 2026-02-07

### Improved

- Sidebar UI polish: better spacing, rounded corners, smoother hover transitions
- Added refresh button with spinning animation while fetching stats
- Today's coding time now has a neon glow effect for emphasis
- Added neon green divider between header and content
- Added "gitagora.xyz" footer to both signed-in and signed-out views
- Stats are cached locally so the panel doesn't flash empty on refresh

### Fixed

- Sidebar now renders correctly when not signed in (shows "Sign in with GitHub" button)
- Added `onView` activation event so sidebar loads even if opened before extension starts
- Panel re-renders when switching back to the GitAgora tab
- Logo.png icon added to sidebar panel header

---

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
