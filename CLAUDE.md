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

- No build. Open via any static server (VS Code Live Server, or `python -m http.server 5500`); ES modules do not work from `file://`.
- Regenerate PWA PNG icons: `node scripts/generate-icons.js` (writes into
  `assets/icons/`).
- Run tests: `node --test "tests/*.test.mjs"` (quote the glob; Node 24 does not discover a bare `tests/` dir). Zero dependencies (`node:test`, `node:assert/strict`). No lint/typecheck config.

### Architecture

- Entry point `index.html` loads `js/app.js` as the single module script.
  External libs (Chart.js 4.6.1, Lucide 1.72.0) load via CDN `<script>` tags,
  not npm. Firebase SDK 10.13.0 loaded lazily (`js/services/firebase-sdk.js`).
- `js/app.js`: `App` class orchestrates hash router (`#/view` via `js/ui/router.js`),
  theme (light / dark / system via `js/ui/theme.js`), sync status subscriber,
  action buttons, and service worker registration. It instantiates view classes
  from `js/views/<screen>/` (`dashboard`, `transactions`, `wallets`, `debts`,
  `budgets`, `analytics`, `settings`, `more`), each having `constructor(containerId)`
  and `render()`, re-rendered by the router when displayed.
- Quick-add sheet in `js/views/transaction-sheet/` (hero amount → category grid → save,
  remembers last type/wallet) and debt modal in `js/views/debt-sheet/`.
- No `window.*` app globals anymore.
- Shared UI primitives in `js/ui/`: `bottom-sheet.js`, `currency-input.js`,
  `category-grid.js`, `wallet-picker.js`, `router.js` with `#/view` hashes,
  `sync-badge.js`, `transaction-row.js`, `theme.js`, `icons.js`.
- CSS architecture: `css/variables.css` (design tokens, light/dark theme),
  `css/ui.css`, `css/sheets.css`, `css/views/*.css`, and `css/layouts.css`
  (App Shell: desktop sidebar ≥1024px, mobile 5-item bottom nav with center raised `+` button).
- `js/state.js`: thin `StateStore` singleton (Pub/Sub) delegating action mutations
  to `js/state/*` (`transaction-actions.js`, `wallet-actions.js`, `debt-actions.js`,
  `category-budget-actions.js`, `cloud-session-actions.js`, `persistence.js`).
  Every mutating action notifies subscribers, persists the state to `localStorage`
  (via `js/services/storage.js`, keys in `js/config.js` `STORAGE_KEYS`, prefixed `qlct_*`),
  and triggers sync if signed in. The app itself does not use IndexedDB; only the Firebase
  SDK uses IndexedDB internally for auth/cache.
- Wallet `currentBalance` is never mutated directly — `computeWalletBalances()`
  in `js/domain/ledger.js` derives every wallet's balance from scratch on each
  change by replaying all transactions and debts/repayments.
- Pure domain modules in `js/domain/`: zero external imports, no DOM/storage/Firebase
  dependencies, unit-tested via `node --test "tests/*.test.mjs"`. Includes:
  - `ledger.js` (wallet balances derived by replaying transactions + debts)
  - `debt-rules.js` (repayment rules)
  - `sync-diff.js` (re-exports `record-hash.js`, `push-diff.js`, `remote-merge.js`)
  - `transaction-entry.js` (validation and default resolution)
  - `period-summary.js` (monthly totals, budget alerts, day grouping)
  - `transaction-query.js` (accent-insensitive search, range/type/category filters, totals)
  - `budget-progress.js` (usage percentage and alert thresholds)
  - `analytics-series.js` (category breakdown and 6-month trends)
  - `legacy-migration.js`, `account-switch.js`, `settings-migration.js`, `export-sanitize.js`.
- Cloud Sync (Firebase only, Google Sheets removed):
  - Firebase SDK 10.13.0 loaded lazily via `js/services/firebase-sdk.js`.
    Default project `sothuchi-5f58e` (`js/config.js` `DEFAULT_FIREBASE_CONFIG`);
    users can enter their own Firebase config in Settings.
  - Sign-in: Google (popup) or Anonymous (must be enabled in Firebase Console →
    Authentication → Sign-in method; app shows a Vietnamese error if not).
  - Firestore layout: `users/{uid}/{transactions|wallets|categories|budgets|debts}/{id}`
    (one document per record) + `users/{uid}/settings/main`; schema marker
    `users/{uid}/meta/schema` `{ version: 2 }`.
  - Legacy layout `users/{uid}/data/{table}` (`{ items: [...] }`) is migrated
    on first sign-in after a confirm dialog and an automatic JSON backup;
    legacy docs are kept, never deleted (`js/services/firebase-migration.js`, `js/services/cloud-session.js`).
  - Sync engine `js/services/firebase-sync.js` (orchestrator) split into
    `firebase-sync-listeners.js`, `firebase-sync-ops.js`, and `firebase-sync-pull.js`:
    realtime listeners per collection, per-record baseline hashes in localStorage
    `qlct_sync_baseline_{uid}`, pushes held until initial snapshots arrive, batched writes ≤450 ops.
  - Sign-in flow: different account than last time → local data replaced;
    first sign-in with data on both sides → user chooses "Dùng dữ liệu Cloud" /
    "Ghi đè Cloud" / "Gộp cả hai" (default). Settings has "Đẩy toàn bộ lên Cloud" /
    "Kéo toàn bộ về máy" when signed in. Known limitation: importing a JSON
    backup while signed in makes the cloud match the file (cloud records missing
    from the file are deleted).
  - Security rules: `firestore.rules` in repo (each user can only read/write
    `users/{uid}/**`). Deploy: Firebase Console → Firestore Database → Rules
    (paste + Publish) or `firebase deploy --only firestore:rules --project sothuchi-5f58e`
    (needs a `firebase.json` with `{"firestore":{"rules":"firestore.rules"}}`, not in repo).
- `sw.js` precaches an explicit `ASSETS_TO_CACHE` file list for offline PWA use;
  `tests/sw-assets.test.mjs` fails if a file under `js/`, `css/`, `assets/icons/`
  is missing from it. Bump `CACHE_NAME` on every release. CDN libs pinned:
  lucide 1.72.0, chart.js 4.6.1 (cached at runtime in `qlct-cdn-v1`).
  Offline works only after one online visit (browser limitation).
- Conventions (from `docs/code-standards.md`): kebab-case filenames, all JS
  files strictly under 200 lines, currency displayed as Vietnamese `###.###.### ₫`,
  dates stored `YYYY-MM-DD` and displayed `DD/MM/YYYY`, dynamic HTML escaped
  via `escapeHtml()`, and `try...catch` around storage and Firebase operations.