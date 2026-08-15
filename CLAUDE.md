# FIS AI Kit Engineer Context

This file is the always-loaded contract for FIS AI Kit Engineer. Keep it short. Load the linked rule files only when the current task needs them.

## Core Rules

- Optimize for the user's workflow: clear prompts, useful errors, real implementation, no performative ceremony — but always show the analysis behind any decision you ask the user to make.
- Before asking the user to choose between approaches (`AskUserQuestion` or otherwise), present the options and your reasoning in visible response text first. Never ask about analysis the user has not seen; write every option so it stands alone. Internal reasoning is invisible to the user — externalize it before any decision point.
- Before implementation, read `README.md` plus relevant project docs in `docs/` when they exist.
- Work in the current project. Do not edit `~/.claude/skills` unless the user explicitly asks for global skill changes.
- Preserve secrets and private files. Never work around privacy hooks or commit credentials.
- Use the repo's existing patterns, commands, and public contracts before inventing new ones.
- Prefer small, focused changes. Add abstractions only when they remove real complexity.

## On-Demand References

- Implementation and verification: `./.claude/rules/development-rules.md`
- Feature/debug workflow shape: `./.claude/rules/primary-workflow.md`
- Subagents or teams: `./.claude/rules/orchestration-protocol.md`
- Plans and docs: `./.claude/rules/documentation-management.md`
- Review, audit, or scope cuts: `./.claude/rules/review-audit-self-decision.md`
- Long-running processes, ports, or worktree cleanup: `./.claude/rules/process-management.md`

Skill routing is capability-based. Name the capability, then resolve it against the runtime's live skill catalog:

- Ambiguous domain choice: `./.claude/rules/skill-domain-routing.md`
- Multi-step workflow sequence: `./.claude/rules/skill-workflow-routing.md`

A few decisions still live with the owning skill:

- Visual explanations or diagrams: `./.claude/skills/fis-preview/references/generation-modes.md`
- Documentation update decisions: `./.claude/skills/fis-docs/references/update-workflow.md`

Use skill names and descriptions first. Open these references only when routing is ambiguous or the current workflow needs the detail.

## Hook Responses

If the privacy-block hook emits a marker between `@@PRIVACY_PROMPT_START@@` and `@@PRIVACY_PROMPT_END@@`, parse the JSON and ask the user for approval with `AskUserQuestion`. If access is denied, continue without that file.

## Skill Scripts

When running Python scripts from `.claude/skills/`, use the skill venv:

- macOS/Linux: `.claude/skills/.venv/bin/python3`
- Windows: `.claude\skills\.venv\Scripts\python.exe`

If a skill script fails and the task depends on it, debug the local skill copy in this project rather than bypassing the failure.

## Project: Sổ Thu Chi (Personal Finance Tracker)

Pure client-side SPA (Vanilla JS ES Modules, no framework, no build step, no
`package.json`, no test runner). Full details in `docs/system-architecture.md`
and `docs/code-standards.md` — read them before non-trivial changes.

### Running / Commands

- No build. Open `index.html` directly in a browser, or serve it with VS
  Code's Live Server extension (or any static server) for the best experience.
- Regenerate PWA PNG icons: `node scripts/generate-icons.js` (writes into
  `assets/icons/`).
- No lint/test/typecheck config exists in this repo — do not invent one.

### Architecture

- Entry point `index.html` loads `js/app.js` as the single module script.
  External libs (Chart.js, Lucide icons, Google Identity Services) load via
  CDN `<script>` tags, not npm.
- `js/app.js`: `App` class orchestrates view routing (`data-view` attributes),
  theme (light/dark via `data-theme`), modal wiring, and service worker
  registration. It instantiates one component per view from `js/components/`.
- `js/state.js`: single `StateStore` singleton (Pub/Sub) is the source of
  truth for `transactions`, `wallets`, `categories`, `budgets`, `debts`,
  `settings`. Every mutating method calls `notify()`, which persists the
  whole state to `localStorage` (via `js/services/storage.js`, keys in
  `js/config.js` `STORAGE_KEYS`, prefixed `qlct_*`) and re-runs all
  subscribers.
- Wallet `currentBalance` is never mutated directly — `recalculateWalletBalances()`
  derives every wallet's balance from scratch on each change by replaying all
  transactions and debts/repayments. Any new feature that moves money must be
  added to this recalculation, not to ad-hoc balance updates.
- Google Sync is two independent services under `js/services/`:
  `google-auth.js` (GIS OAuth2 token client; persists access token + expiry in
  `localStorage` under `quanlythuchi_google_access_token` /
  `..._token_expires_at`, separate from the `qlct_*` state keys) and
  `google-sheets.js` (Sheets API v4 find-or-create + push/pull against a
  spreadsheet named `QuanLyChiTieu_DB` with 6 tabs: Transactions, Wallets,
  Categories, Budgets, Debts, Settings). The Google OAuth Client ID is
  user-supplied at runtime (Settings view) and stored in
  `state.settings.googleClientId` — never hardcode one.
- `sw.js` precaches an explicit `ASSETS_TO_CACHE` file list for offline PWA
  use. Adding a new JS/CSS file requires adding its path to that list and
  bumping `CACHE_NAME`, or the file won't be available offline / stale copies
  won't invalidate.
- Conventions (from `docs/code-standards.md`): kebab-case filenames, keep
  files under ~200 lines (split into `components/`/`services/`/`utils/` when
  they grow), currency formatted as Vietnamese `###.###.### ₫`, dates as
  `DD/MM/YYYY`, and `try...catch` around every storage read/write and Google
  API call.