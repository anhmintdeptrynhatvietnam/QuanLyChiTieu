# Sổ Thu Chi (Personal Finance Tracker) — Read-Only Refactor & Readiness Audit

- **Audit Date:** 2026-11-13
- **Scope:** Full read-only audit of pure client-side SPA (`index.html`, `sw.js`, `manifest.json`, `js/**/*.js`, `css/*.css`, `scripts/generate-icons.js`, `README.md`, `CLAUDE.md`, `docs/*.md`, `plans/*/plan.md`, `plans/reports/*.md`).
- **Target File:** `plans/reports/agy-audit-261113-1418-refactor-readiness.md`
- **Source Files Modified:** None (read-only audit).

---

## 1. Module Map & Dependency Graph

### 1.1. Module Inventory & Responsibilities
| File Path | Lines | Primary Responsibility | Exports | Imported By |
| :--- | :---: | :--- | :--- | :--- |
| `js/config.js` | 113 | Initial defaults, constants, palette & storage keys | `DEFAULT_CATEGORIES`, `DEFAULT_WALLETS`, `DEFAULT_FIREBASE_CONFIG`, `DEFAULT_SETTINGS`, `STORAGE_KEYS`, `CATEGORY_PALETTE` | `state.js`, `analytics.js`, `settings.js`, `firebase-auth.js` |
| `js/state.js` | 476 | Central reactive state store (Pub/Sub), local persistence & orchestration | `stateStore` (instance), `StateStore` | `app.js`, `google-auth.js`, `google-sheets.js`, `export-import.js`, all `components/*.js` |
| `js/services/storage.js` | 46 | Safe synchronous wrapper around `window.localStorage` | `StorageService` | `state.js` |
| `js/services/google-auth.js` | 136 | GIS (Google Identity Services) OAuth2 token client & token persistence | `GoogleAuthService`, `googleAuthService` | `app.js`, `settings.js`, `sync-modal.js` |
| `js/services/google-sheets.js` | 341 | Google Sheets API v4 CRUD, batchClear, batchUpdate & pre-pull snapshot backup | `GoogleSheetsService` | `settings.js`, `sync-modal.js` |
| `js/services/firebase-auth.js` | 134 | Firebase v10 Auth wrapper (Google Popup & Anonymous Guest) via gstatic CDN | `FirebaseAuthService`, `firebaseAuthService` | `app.js`, `state.js`, `firebase-sync.js`, `settings.js` |
| `js/services/firebase-sync.js` | 240 | Firestore v10 Realtime sync, multi-tab cache manager & debounced push | `FirebaseSyncService`, `firebaseSyncService` | `app.js`, `state.js`, `settings.js` |
| `js/services/export-import.js` | 67 | JSON full state backup/restore and CSV transactions export | `ExportImportService` | `settings.js` |
| `js/utils/formatters.js` | 70 | Vietnamese currency (`Intl.NumberFormat`), number parsing & date formatters | `formatCurrency`, `formatNumber`, `parseFormattedNumber`, `formatDate`, `formatRelativeDate`, `getMonthYear`, `formatMonthYearDisplay` | `state.js`, `dashboard.js`, `transaction-list.js`, `wallets.js`, `debts.js`, `budgets.js`, `analytics.js`, `transaction-modal.js` |
| `js/utils/helpers.js` | 93 | UUID generator (`crypto.randomUUID`), debounce, `escapeHtml`, date ranges | `generateId`, `debounce`, `escapeHtml`, `getDateRange`, `getCurrentDateFormatted` | `state.js`, `export-import.js`, `firebase-sync.js`, all `components/*.js` |
| `js/utils/modal-a11y.js` | 16 | ARIA attributes (`role="dialog"`, `aria-modal`) and Escape key dismissal | `attachModalA11y` | `wallets.js`, `debts.js`, `budgets.js`, `transaction-modal.js`, `sync-modal.js` |
| `js/utils/privacy.js` | 89 | Eye toggle state in `localStorage` (`privacy_show_*`) & masking buttons | `isAmountVisible`, `setAmountVisible`, `toggleAmountVisibility`, `renderEyeButton`, `attachPrivacyListeners` | `dashboard.js`, `wallets.js`, `debts.js` |
| `js/components/confirm-dialog.js` | 171 | Singleton modal replacing native `confirm()`/`prompt()` with type-to-confirm gate | `ConfirmDialog`, `confirmDialog`, `promptDialog` | `transaction-list.js`, `wallets.js`, `debts.js`, `settings.js`, `sync-modal.js`, `transaction-modal.js` |
| `js/components/toast.js` | 59 | Floating auto-dismiss notification toast container | `Toast`, `showToast` | `google-auth.js`, `wallets.js`, `debts.js`, `settings.js`, `sync-modal.js`, `transaction-modal.js` |
| `js/components/dashboard.js` | 257 | Summary asset cards, monthly income/expense totals & recent transactions | `Dashboard` | `app.js` |
| `js/components/transaction-list.js` | 313 | Date-grouped transaction feed, search query & multidimensional filters | `TransactionList` | `app.js` |
| `js/components/wallets.js` | 297 | Multi-wallet CRUD cards, balance calculation & credit card liability display | `Wallets` | `app.js` |
| `js/components/debts.js` | 597 | Lend/borrow tracking, partial repayment modal & payment history timeline | `Debts` | `app.js` |
| `js/components/budgets.js` | 245 | Category monthly spending limits, progress bars & threshold alerts | `Budgets` | `app.js` |
| `js/components/analytics.js` | 250 | Chart.js visual reports (Doughnut breakdown & 6-month Bar comparison) | `Analytics` | `app.js` |
| `js/components/settings.js` | 716 | Cloud configuration (Firebase & Google Sheets), category CRUD & danger zone | `Settings` | `app.js` |
| `js/components/transaction-modal.js` | 485 | Add/Edit modal form supporting Expense, Income, Transfer & Debt quick logging | `TransactionModal` | `app.js` |
| `js/components/sync-modal.js` | 320 | Google Sheets push trigger & backup snapshot restoration modal | `SyncModal` | `settings.js` |
| `js/app.js` | 236 | Application entry point bootstrap, tab router, theme switcher & PWA registration | `App` (class) | Loaded directly by `index.html:163` |
| `sw.js` | 97 | Service Worker: static precaching & network-first/cache-fallback fetch strategy | Event listeners | Registered in `app.js:50` |
| `scripts/generate-icons.js` | 129 | Node.js script generating PNG app icons without native canvas using zlib CRC32 | None (CLI script) | Manual execution |

### 1.2. Dependency Graph (Text Representation)
```text
index.html
  └── js/app.js
        ├── js/state.js
        │     ├── js/config.js
        │     ├── js/services/storage.js
        │     ├── js/services/firebase-auth.js (CDN: firebase/auth)
        │     │     └── js/config.js
        │     ├── js/services/firebase-sync.js (CDN: firebase/firestore)
        │     │     ├── js/services/firebase-auth.js
        │     │     └── js/utils/helpers.js
        │     ├── js/utils/formatters.js
        │     └── js/utils/helpers.js
        ├── js/services/google-auth.js
        │     ├── js/state.js
        │     └── js/components/toast.js
        ├── js/services/firebase-auth.js
        ├── js/services/firebase-sync.js
        ├── js/components/dashboard.js
        │     ├── js/state.js
        │     ├── js/utils/formatters.js
        │     ├── js/utils/helpers.js
        │     └── js/utils/privacy.js
        ├── js/components/transaction-list.js
        │     ├── js/state.js
        │     ├── js/utils/formatters.js
        │     ├── js/utils/helpers.js
        │     └── js/components/confirm-dialog.js
        ├── js/components/wallets.js
        │     ├── js/state.js
        │     ├── js/utils/formatters.js
        │     ├── js/utils/helpers.js
        │     ├── js/utils/modal-a11y.js
        │     ├── js/utils/privacy.js
        │     ├── js/components/confirm-dialog.js
        │     └── js/components/toast.js
        ├── js/components/debts.js
        │     ├── js/state.js
        │     ├── js/utils/formatters.js
        │     ├── js/utils/helpers.js
        │     ├── js/utils/modal-a11y.js
        │     ├── js/utils/privacy.js
        │     ├── js/components/confirm-dialog.js
        │     └── js/components/toast.js
        ├── js/components/budgets.js
        │     ├── js/state.js
        │     ├── js/utils/formatters.js
        │     ├── js/utils/helpers.js
        │     └── js/utils/modal-a11y.js
        ├── js/components/analytics.js
        │     ├── js/state.js
        │     ├── js/config.js
        │     ├── js/utils/formatters.js
        │     └── js/utils/helpers.js
        ├── js/components/settings.js
        │     ├── js/state.js
        │     ├── js/config.js
        │     ├── js/services/google-auth.js
        │     ├── js/services/google-sheets.js
        │     │     └── js/state.js
        │     ├── js/services/export-import.js
        │     │     ├── js/state.js
        │     │     └── js/utils/helpers.js
        │     ├── js/services/firebase-auth.js
        │     ├── js/services/firebase-sync.js
        │     ├── js/components/sync-modal.js
        │     │     ├── js/state.js
        │     │     ├── js/services/google-auth.js
        │     │     ├── js/services/google-sheets.js
        │     │     ├── js/components/toast.js
        │     │     ├── js/utils/helpers.js
        │     │     ├── js/utils/modal-a11y.js
        │     │     └── js/components/confirm-dialog.js
        │     ├── js/components/toast.js
        │     ├── js/components/confirm-dialog.js
        │     └── js/utils/helpers.js
        └── js/components/transaction-modal.js
              ├── js/state.js
              ├── js/utils/formatters.js
              ├── js/utils/helpers.js
              ├── js/utils/modal-a11y.js
              ├── js/components/toast.js
              └── js/components/confirm-dialog.js
```

### 1.3. Circular Dependencies & Global Coupling Assessment
- **ES Module Circular Imports:** None detected. The static module import graph is acyclic.
- **Runtime Global Coupling (`window` anti-patterns):**
  - `window.appInstance` assigned in `js/app.js:235`, consumed in `js/components/dashboard.js:234, 241, 249` to switch views.
  - `window.transactionModal` assigned in `js/app.js:58`, consumed in `js/components/transaction-list.js:288, 298`.
  - `window.syncModal` assigned in `js/components/settings.js:17`, consumed in `js/app.js:162`.
  - `window.setAppTheme` and `window.getAppTheme` assigned in `js/app.js:35-36`, consumed in `js/components/settings.js:34, 533`.
  - `window.showToast` exported to `window` in `js/components/toast.js:58`.

---

## 2. Data Model & Cross-Layer Inconsistencies

### 2.1. Entity Schema As Actually Used
1. **Transactions (`state.transactions[]`)**
   - Shape: `{ id: string, type: 'expense'|'income'|'transfer', amount: number, categoryId: string, walletId: string, toWalletId: string|null, date: 'YYYY-MM-DD', note: string, createdAt: ISO8601, updatedAt: ISO8601 }` (`js/state.js:165-176`).
2. **Wallets (`state.wallets[]`)**
   - Shape: `{ id: string, name: string, type: 'cash'|'bank'|'credit'|'saving', initialBalance: number, currentBalance: number, icon: string, color: string, createdAt?: ISO8601 }` (`js/state.js:212-221`, `js/config.js:26-62`).
3. **Categories (`state.categories[]`)**
   - Shape: `{ id: string, name: string, type: 'expense'|'income', icon: string, color: string, createdAt?: ISO8601 }` (`js/state.js:255-262`, `js/config.js:5-23`).
4. **Budgets (`state.budgets[]`)**
   - Shape: `{ id: string, categoryId: string, month: 'YYYY-MM', limitAmount: number, createdAt: ISO8601, updatedAt?: ISO8601 }` (`js/state.js:409-418`).
5. **Debts (`state.debts[]`)**
   - Shape: `{ id: string, personName: string, type: 'lend'|'borrow', amount: number, remainingAmount: number, walletId: string, dueDate: string|null, note: string, status: 'pending'|'partially_paid'|'paid', repayments: Repayment[], createdAt: ISO8601, updatedAt: ISO8601 }` (`js/state.js:291-304`).
   - `Repayment`: `{ id: string, amount: number, walletId: string, date: 'YYYY-MM-DD', note: string, createdAt: ISO8601 }` (`js/state.js:319-326`).
6. **Settings (`state.settings`)**
   - Shape: `{ currency: string, currencySymbol: string, theme: 'light'|'dark', googleClientId: string, spreadsheetId: string, spreadsheetName: string, autoSync: boolean, lastSyncTime: string|null, syncProvider: 'firebase', firebaseConfig: object, firebaseUser: object|null }` (`js/config.js:74-86`).

### 2.2. Inconsistencies Across Data Layers
- **Debts `updatedAt` Dropped in Google Sheets:** `js/services/google-sheets.js:106` defines columns `['id', 'personName', 'type', 'amount', 'remainingAmount', 'walletId', 'dueDate', 'note', 'status', 'repaymentsJSON', 'createdAt']`. The field `updatedAt` is omitted in push and lost on pull (`js/services/google-sheets.js:210`).
- **Google Sheets Phantom `Settings` Tab:** `js/services/google-sheets.js:31` creates a 6th sheet titled `'Settings'` when initializing `QuanLyChiTieu_DB`. However, `pushData` (`js/services/google-sheets.js:60, 67-112`) never writes to `'Settings'`, and `pullData` (`js/services/google-sheets.js:133`) never reads from `'Settings'`. The tab remains perpetually empty.
- **`createdAt` Disparity in Wallets & Categories:** In `js/config.js:26-62`, default wallets and categories omit `createdAt`. When user creates new wallets/categories (`js/state.js:220, 261`), `createdAt` is populated. Google Sheets schema drops `createdAt` for both wallets and categories (`js/services/google-sheets.js:82, 90`).
- **CSV Export Incomplete:** `js/services/export-import.js:19-49` exports transactions only. Wallets, categories, budgets, and debts cannot be exported to CSV.
- **JSON Export Over-Exposure:** `js/services/export-import.js:10` serializes the full unredacted state, exporting `settings.firebaseUser` (containing Firebase user UID, email, displayName, photoURL) and `settings.firebaseConfig` with public API keys.

---

## 3. Money-Flow Correctness

### 3.1. Balance Calculation Analysis (`js/state.js:358-400`)
- `recalculateWalletBalances()` replays the full ledger sequentially:
  1. Base: sets `balances[w.id] = Number(w.initialBalance) || 0`.
  2. Transactions:
     - `expense`: subtracts `t.amount` from `balances[t.walletId]`.
     - `income`: adds `t.amount` to `balances[t.walletId]`.
     - `transfer`: subtracts from `balances[t.walletId]`, adds to `balances[t.toWalletId]`.
  3. Debts & Repayments:
     - `lend`: subtracts `debt.amount` from `balances[debt.walletId]`.
     - `borrow`: adds `debt.amount` to `balances[debt.walletId]`.
     - Repayment on `lend`: adds `rep.amount` to `balances[rep.walletId]`.
     - Repayment on `borrow`: subtracts `rep.amount` from `balances[rep.walletId]`.
  4. Final assignment: sets `w.currentBalance = balances[w.id]`.

### 3.2. Money-Flow Flaws & Bypasses
- **Wallet Deletion Does Not Check Debts (`js/state.js:243-250`):** `deleteWallet(id)` checks if `transactions` reference the wallet (`t.walletId === id || t.toWalletId === id`), but fails to check `state.debts` (`debt.walletId === id` or `rep.walletId === id`). If a wallet referenced by debts is deleted, the wallet disappears, but the debt remains active. In addition, `deleteWallet()` does not invoke `recalculateWalletBalances()`.
- **Debt Repayment Overpayment Disparity (`js/state.js:331` vs `js/state.js:389-393`):** In `recordRepayment()`, `debt.remainingAmount = Math.max(0, remaining - repayAmount)`. If a user records a repayment exceeding `remainingAmount`, `remainingAmount` clamps to 0, but `recalculateWalletBalances()` credits/debits the full unconstrained `rep.amount` into the wallet. Neither UI (`js/components/debts.js:589`) nor `state.js` validates that `repayAmount <= debt.remainingAmount`.
- **Credit Card Liability Exclusion on Dashboard (`js/components/dashboard.js:25-26`):**
  - `totalBalance` explicitly filters out `credit` wallets: `state.wallets.filter(w => w.type !== 'credit')`.
  - When spending from a credit card, `currentBalance` turns negative (e.g., `-5.000.000 ₫`).
  - Dashboard `Total Assets` displays positive assets, but negative credit card balances are not added to `Total Borrowed / Payables` (`dashboard.js:49-50`). The user's actual debt liability is invisible on the dashboard overview.

---

## 4. Sync Layer: Coexistence, Conflicts & Edge Cases

### 4.1. Architecture & Dual-Cloud Coexistence
- **Coexistence Model:** The SPA supports both Google Sheets API (batch snapshot push/pull) and Firebase Firestore (realtime document listeners).
- **No Master Clock or Conflict Arbiter:** Neither sync engine implements vector clocks, CRDTs, or revision hashing. Whichever system pulls/applies last completely overwrites state.
- **Developer Workaround in Code:** Pull from Google Sheets was deliberately commented out in `js/components/settings.js:214-219, 662-682` and `js/components/sync-modal.js:78-100, 266-307` with the inline comment: `/* Tạm thời tắt tính năng Pull Google Sheets để tránh ghi đè / xung đột với Firebase Realtime */`.

### 4.2. Specific Sync Failure Modes
- **Shared Debounce Timer Dropping Syncs (`js/services/firebase-sync.js:145-155`):**
  - `this.pushTimeout` is a single shared variable across all tables.
  - If `scheduleSync('transactions', ...)` is called and within 400ms another table calls `scheduleSync('wallets', ...)`, `clearTimeout(this.pushTimeout)` cancels the transaction sync. The transactions payload is completely dropped and never pushed to Firestore.
- **Multi-Table Mutation with Single-Table Notification (`js/state.js:278-286`):**
  - `deleteCategory(id)` mutates `categories` AND removes orphaned `budgets` (`this.state.budgets = this.state.budgets.filter(b => b.categoryId !== id)`).
  - It then calls `this.notify('category:deleted', id)`.
  - In `notify()` (`js/state.js:134`), only `scheduleSync('categories', ...)` is dispatched. `budgets` is never pushed to Firebase, leaving ghost budgets in Firestore.
- **`data:imported` Disregarded by Firebase Sync (`js/state.js:129-147, 472`):**
  - When data is restored via JSON import or pre-pull snapshot restoration (`importAllData`), it emits `notify('data:imported', this.state)`.
  - `notify()` only checks for events starting with `transaction:`, `wallet:`, `category:`, `budget:`, `debt:`, or `settings:updated`.
  - Consequently, after importing a full JSON backup, zero updates are scheduled to Firebase. Firestore retains obsolete data until individual records are touched.
- **Multi-Tab Realtime Blocked by Shared `_lastDeviceId` (`js/services/firebase-sync.js:31-37, 104-106`):**
  - `deviceId` is persisted to `localStorage.getItem('qlct_device_id')`.
  - All tabs in the same browser share the exact same `localStorage` value.
  - When Tab A writes to Firestore with `_lastDeviceId: this.deviceId`, Tab B receives the snapshot in `onSnapshot()`.
  - Tab B evaluates `data._lastDeviceId === this.deviceId`, which resolves to `true`.
  - Tab B returns early (`return;` at line 105) and ignores the update. Cross-tab synchronization within the same browser is completely non-functional.

---

## 5. Concrete Defects & Bug Register

| ID | Severity | File & Line | Trigger Scenario | Concrete Impact |
| :--- | :---: | :--- | :--- | :--- |
| **BUG-01** | **Critical** | `js/services/firebase-sync.js:145-155` | Two entities updated within 400ms (e.g. category delete + budget update, or rapid transaction logs). | Single `pushTimeout` is cleared; prior table push is canceled and lost from Firestore. |
| **BUG-02** | **Critical** | `js/services/firebase-sync.js:31-37, 104-106` | Opening app in multiple browser tabs on same machine. | `_lastDeviceId` matches across tabs; `onSnapshot` discards changes; tabs desynchronize. |
| **BUG-03** | **Critical** | `js/state.js:129-147, 472` | Restoring JSON backup or Google Sheets snapshot via `importAllData()`. | `data:imported` has no branch in `notify()`; Firebase Firestore is never updated with imported state. |
| **BUG-04** | **High** | `js/state.js:282-284, 134-137` | Deleting a category that has active budgets. | `budgets` array is modified locally, but only `categories` is pushed to Firebase; ghost budgets persist in cloud. |
| **BUG-05** | **High** | `js/state.js:243-250` | Deleting a wallet that is associated with active debts or debt repayments. | `deleteWallet` only verifies transactions; allows deleting wallet with debts, breaking money reconciliation. |
| **BUG-06** | **High** | `js/services/google-sheets.js:106, 210` | Pushing debts to Google Sheets and restoring/pulling. | Column mapping excludes `updatedAt`; debt `updatedAt` is stripped and replaced with `undefined`. |
| **BUG-07** | **High** | `js/components/settings.js:461, 480` | Initializing `Settings` component event listeners (`bindCardEvents`). | Elements `#btn-firebase-push-all` and `#btn-firebase-pull-all` do not exist in HTML template; listeners attach to `null`. |
| **BUG-08** | **Medium** | `js/components/toast.js:38` | Triggering a toast notification with raw error message or unescaped text. | `toast.innerHTML` directly interpolates `${message}`, opening DOM XSS vector if message contains user input. |
| **BUG-09** | **Medium** | `js/state.js:331` | Recording debt repayment larger than `debt.remainingAmount`. | `remainingAmount` clamps to 0 while wallet balance receives unconstrained excess repayment amount. |
| **BUG-10** | **Medium** | `js/state.js:403-423` | User attempts to delete a budget limit. | No `deleteBudget` method exists in `StateStore`; limit can only be set to 0, leaving stale records in state. |
| **BUG-11** | **Low** | `sw.js:7-42` | First load offline or cache invalidation on fresh browser. | `./js/utils/privacy.js` is missing from `ASSETS_TO_CACHE`; offline load throws missing module error. |
| **BUG-12** | **Low** | `js/state.js:24, 47` | Initial bootstrap and account sign-in. | `recalculateWalletBalances()` called repeatedly on initialization without state change. |

---

## 6. Security & Privacy Audit

### 6.1. XSS Vulnerabilities (`innerHTML` Injection)
- **High Risk (`js/components/toast.js:38`):**
  ```javascript
  toast.innerHTML = `
    <i data-lucide="${icon}" style="width: 18px; height: 18px; color: ${color}; flex-shrink: 0;"></i>
    <span>${message}</span>
  `;
  ```
  `message` is passed directly without HTML escaping. In `js/components/settings.js:430, 443, 473, 497, 597, 657, 696`, error strings like `err.message` are passed directly into `showToast('... ' + err.message, 'error')`. If an error string reflects unescaped user data or network responses, malicious script executes.
- **Audited Components Using `escapeHtml`:** `dashboard.js:199, 221`, `transaction-list.js:73, 103, 109, 225, 227, 228`, `wallets.js:150, 153, 159`, `debts.js:276, 302, 314, 555`, `budgets.js:146`, `analytics.js:133`, `settings.js:96, 99, 104, 106, 143, 147, 151, 178, 228, 266, 284`. These inputs are properly escaped.

### 6.2. Token Storage & Credential Leakage
- **Google OAuth Access Token (`js/services/google-auth.js:39-40`):** Access token and expiry are stored in plaintext in `localStorage` (`quanlythuchi_google_access_token` and `quanlythuchi_google_token_expires_at`). Accessible by any client script running on the origin.
- **Firebase User Token Object in LocalStorage & JSON Export (`js/state.js:34, 156` & `js/services/export-import.js:10`):**
  - `state.settings.firebaseUser` contains `{ uid, displayName, email, photoURL, isAnonymous }` (`js/services/firebase-auth.js:34-40`).
  - Saved to `localStorage.getItem('qlct_settings')`.
  - Dumped directly into `QuanLyChiTieu_Backup_*.json` during backup export (`exportJSON()`). Anyone sharing their backup file unintentionally leaks personal identity and authentication identifiers.
- **Google Client ID & Spreadsheet ID Exported:** `settings.googleClientId` and `settings.spreadsheetId` are bundled into the public JSON export file without sanitization.

### 6.3. Hardcoded Credentials & Shared Default Firebase Project
- `js/config.js:64-72`: `DEFAULT_FIREBASE_CONFIG` embeds production project credentials:
  ```javascript
  apiKey: "AIzaSy…", // redacted, see js/config.js
  authDomain: "sothuchi-5f58e.firebaseapp.com",
  databaseURL: "https://sothuchi-5f58e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sothuchi-5f58e",
  appId: "1:375858739110:web:c995da1d3802dc491d8167"
  ```
  Because this config is active by default for all instances, every user of this application who clicks "Đăng nhập Google" or "Dùng thử Ẩn danh" without providing custom configuration writes directly to the developer's shared Firebase project `sothuchi-5f58e`.

### 6.4. CSP & Subresource Integrity (SRI)
- **No CSP Defined (`index.html`):** Neither `<meta http-equiv="Content-Security-Policy">` nor server HTTP response headers are configured. Unrestricted script execution and outbound network calls are permitted.
- **Missing SRI Hashes (`index.html:35-37`):**
  - `<script src="https://unpkg.com/lucide@latest"></script>`: loads unpinned `@latest` without integrity hash. A compromised or breaking release on unpkg directly impacts all clients.
  - `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`: loads unpinned CDN script without `integrity` attribute.
  - External Firebase ES modules (`https://www.gstatic.com/firebasejs/10.13.0/...`) imported dynamically without subresource verification.

---

## 7. Standards Violations & Code Duplication

### 7.1. File Size Violations (>200 Lines Standard)
Rule `docs/code-standards.md:5`: *"Giữ mỗi file mã nguồn dưới 200 dòng."*
15 files violate this rule:
1. `js/components/settings.js` — **716 lines** (+516 lines, 358% over limit)
2. `js/components/debts.js` — **597 lines** (+397 lines, 298% over limit)
3. `css/components.css` — **514 lines** (+314 lines, 257% over limit)
4. `js/components/transaction-modal.js` — **485 lines** (+285 lines, 242% over limit)
5. `js/state.js` — **476 lines** (+276 lines, 238% over limit)
6. `js/services/google-sheets.js` — **341 lines** (+141 lines, 170% over limit)
7. `js/components/sync-modal.js` — **320 lines** (+120 lines, 160% over limit)
8. `js/components/transaction-list.js` — **313 lines** (+113 lines, 156% over limit)
9. `js/components/wallets.js` — **297 lines** (+97 lines, 148% over limit)
10. `js/components/dashboard.js` — **257 lines** (+57 lines, 128% over limit)
11. `js/components/analytics.js` — **250 lines** (+50 lines, 125% over limit)
12. `js/components/budgets.js` — **245 lines** (+45 lines, 122% over limit)
13. `js/services/firebase-sync.js` — **240 lines** (+40 lines, 120% over limit)
14. `js/app.js` — **236 lines** (+36 lines, 118% over limit)
15. `css/layouts.css` — **209 lines** (+9 lines, 104% over limit)

### 7.2. Missing `try...catch` Blocks
Rule `docs/code-standards.md:10`: *"Sử dụng mô hình xử lý lỗi try...catch ở tất cả các hàm đọc/ghi Storage và gọi Google API."*
- Unprotected `localStorage` access in `js/app.js:30, 82` (`localStorage.getItem('theme')`, `localStorage.setItem('theme', theme)`).
- Unprotected `localStorage` write in `js/components/settings.js:536` (`localStorage.setItem('theme', themeVal)`).
- Unprotected `localStorage.clear()` in `js/components/settings.js:711`.
- Unprotected `localStorage.getItem/setItem('qlct_device_id')` in `js/services/firebase-sync.js:31, 34`.
- Unprotected network `fetch()` calls in `js/services/google-sheets.js:9-19, 35-46, 53-62, 116-128, 136-139` without individual localized error boundaries.

### 7.3. Date Formatting Inconsistencies
Rule `docs/code-standards.md:11`: *"Định dạng ngày tháng theo chuẩn DD/MM/YYYY"*.
- In `js/utils/helpers.js:87-93`, `getCurrentDateFormatted()` returns `YYYY-MM-DD`.
- In `js/state.js:172, 323`, transaction dates and repayments are persisted in ISO date format `YYYY-MM-DD`.
- Google Sheets (`js/services/google-sheets.js:74`) stores `YYYY-MM-DD`.
- UI renders `DD/MM/YYYY` via `formatDate()` (`js/utils/formatters.js:29-39`). Storage format vs presentation standard is undocumented and split across layers.

### 7.4. Duplicated Logic
- **Modal Lifecycle Wiring:** Backdrop click, Escape close, `.active` class toggles, and `setTimeout(() => input.focus(), 150)` are copy-pasted across `wallets.js:181, 271`, `debts.js:348, 373, 499, 573`, `budgets.js:180, 227`, `transaction-modal.js:164, 396`, `sync-modal.js:131`.
- **Wallet Select Generator:** Duplicated between `js/components/debts.js:432-444` and `js/components/transaction-modal.js:319-327`.
- **Numeric Currency Input Masking:** Regex cleaning `replace(/\D/g, '')` followed by `parseFormattedNumber` and `formatNumber` is repeated in `wallets.js:189-197`, `debts.js:354-358`, `debts.js:377-381`, `budgets.js:183-191`, `transaction-modal.js:211-219`.
- **Theme Setting Handler:** Duplicated between `js/app.js:79-106` and `js/components/settings.js:529-541`.

---

## 8. PWA & Service Worker Audit (`sw.js`)

### 8.1. Assets Missing from `ASSETS_TO_CACHE`
Comparing actual repository files against `sw.js:7-42`:
- **Missing from `ASSETS_TO_CACHE`:**
  - `./js/utils/privacy.js` (CRITICAL: imported by `dashboard.js`, `wallets.js`, `debts.js`).
- If an offline user loads the PWA, `privacy.js` fails with HTTP 404/ServiceWorker bypass failure, crashing dashboard and wallet components.

### 8.2. Cache Versioning State
- `sw.js:6`: `const CACHE_NAME = 'qlct-pwa-v2.2';`
- Cache key was not bumped when `privacy.js` was introduced, leaving existing service worker clients on stale assets.

### 8.3. Offline Behavior of CDN Imports
- `sw.js:81`:
  ```javascript
  if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
    const responseToCache = networkResponse.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
  }
  ```
- **Cross-Origin CDN Failure:** Requests to `unpkg.com` (Lucide), `cdn.jsdelivr.net` (Chart.js), and `gstatic.com` (Firebase) return `response.type === 'cors'`.
- Because of `networkResponse.type === 'basic'`, the Service Worker **never caches cross-origin CDN scripts into the runtime cache**.
- If the browser purges its HTTP disk cache or if the user opens the PWA offline on a fresh device, Lucide icons, Chart.js, and Firebase modules fail to load completely.

---

## 9. Documentation Drift Analysis

| Documentation Source | Stated Claim in Docs | Actual Implementation in Code |
| :--- | :--- | :--- |
| `README.md:1-76` | Titled and scoped entirely around Google Sheets sync. Zero mention of Firebase. | Code has full Firebase Auth & Firestore sync layer (`firebase-auth.js`, `firebase-sync.js`, `settings.js:70-161`). Default provider is Firebase (`config.js:83`). |
| `docs/system-architecture.md:28, 54` | Claims local persistence is powered by `"IndexedDB / localStorage"`. | Code uses 100% synchronous `localStorage` (`js/services/storage.js:1-46`). Zero lines of IndexedDB exist. |
| `docs/development-roadmap.md:17` | Claims `"Tầng lưu trữ LocalStorage / IndexedDB an toàn"`. | Pure `localStorage` only. |
| `docs/project-changelog.md:1-39` | Records Phase 06 as Google Sheets API sync only; changelog ends at 2026-08-14. | Firebase integration was added subsequently without any changelog entry or version tagging. |
| `CLAUDE.md:87-89` | *"Google OAuth Client ID is user-supplied at runtime... never hardcode one."* | While Google Client ID is runtime-configured, `DEFAULT_FIREBASE_CONFIG` is hardcoded with API keys and project ID in `js/config.js:64-72`. |
| `docs/code-standards.md:5` | Files must be kept under 200 lines. | 15 out of 24 JS/CSS source files exceed 200 lines (up to 716 lines in `settings.js`). |

---

## 10. CSS Quality, Tokens & Integrity

### 10.1. Audit of Reported UI/UX Defects
- `--bg-card` undefined token reported in UI/UX audit: Verified fixed; `js/components/sync-modal.js:52, 79` now references `var(--bg-surface-elevated)`.
- `@keyframes spin` missing keyframe reported in UI/UX audit: Verified fixed; defined in `css/components.css:325-327`.

### 10.2. Hardcoded Color Literals Outside `css/variables.css`
- `js/components/settings.js:45`: `background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-left: 4px solid #f59e0b;` (warning card).
- `js/components/settings.js:50, 57`: `color: #d97706; background: #d97706; border-color: #d97706;` (hardcoded orange buttons).
- `js/components/settings.js:70, 74`: `border: 2px solid rgba(16, 185, 129, 0.4); color: #10b981;`
- `js/components/sync-modal.js:54, 81, 187, 193`: raw RGBA backgrounds `rgba(37, 99, 235, 0.12)`, `rgba(16, 185, 129, 0.12)`, `rgba(239, 68, 68, 0.1)`.
- `js/components/transaction-modal.js:53`: `background: rgba(59, 130, 246, 0.08);`
- `css/components.css:39, 45, 62, 243`: raw RGBA shadows and borders (`rgba(37, 99, 235, 0.2)`, `rgba(239, 68, 68, 0.2)`, `rgba(15, 23, 42, 0.6)`).
- `css/layouts.css:38`: `linear-gradient(135deg, var(--primary-600), #8b5cf6)`.

### 10.3. Unused & Redundant Selectors
- `css/layouts.css:82-85`:
  ```css
  [data-theme="dark"] .nav-link.active {
    background-color: var(--primary-50);
    color: var(--primary-600);
  }
  ```
  Redundant rule: `.nav-link.active` (`css/layouts.css:76-80`) already sets `var(--primary-50)` and `var(--primary-600)`, which automatically adapt under `[data-theme="dark"]` via `css/variables.css:105, 108`.
- Duplicate button tokens: `.chip-sm` (`css/components.css:411-436`) duplicates properties of `.chip` (`css/components.css:184-213`) with slight padding variations.
- Duplicate icon button tokens: `.btn-icon-sm` (`css/components.css:439-459`) duplicates `.btn-icon` (`css/components.css:70-79`).

---

## 11. Proposed Refactor Backlog

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 0: Test Harness Safety Net (Prerequisite)             │
│ - Node test harness for state, balance calc & formatters    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Phase 1: Critical Sync & Data Loss Fixes                    │
│ - Per-table debounce timer in firebase-sync                 │
│ - Multi-tab session-based tabId echo suppression           │
│ - data:imported Firebase push trigger                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Phase 2: Security & Privacy Hardening                       │
│ - XSS sanitization in toast.js                              │
│ - Redact tokens/firebaseUser from exportJSON()              │
│ - Content-Security-Policy & SRI hashes                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Phase 3: Money-Flow & Ledger Integrity                      │
│ - Prevent wallet deletion if referenced in debts            │
│ - Validate debt repayment limits (repay <= remaining)       │
│ - Synchronize category deletion with budgets sync           │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Phase 4: Modularization (<200 lines per file)               │
│ - Split settings.js, debts.js, transaction-modal.js         │
│ - Extract reusable BaseModal controller                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Phase 5: PWA, Service Worker & Docs Alignment               │
│ - Precache privacy.js, cache CORS CDN scripts               │
│ - Align README & Architecture docs with Firebase reality    │
└─────────────────────────────────────────────────────────────┘
```

### Phase 0: Test Harness Safety Net (Prerequisite)
- **Scope:** Introduce a lightweight zero-dependency Node.js test runner script (e.g. `tests/run-tests.mjs`) executing against ES module domain logic without bundling.
- **Target Files:** New `tests/state-store.test.mjs`, `tests/formatters.test.mjs`, `tests/firebase-sync.test.mjs`.
- **Risk:** Low. No production code modified.
- **Prerequisite:** Node.js v18+ environment.

### Phase 1: Critical Sync & Data Loss Fixes
- **Scope:**
  - Key `pushTimeouts` per table name in `js/services/firebase-sync.js` to eliminate race-condition data drops (`BUG-01`).
  - Replace `localStorage` deviceId echo check with `sessionStorage` or runtime `tabId` to restore cross-tab realtime sync (`BUG-02`).
  - Wire `data:imported` in `js/state.js:147` to trigger `firebaseSyncService.pushAllData(this.state)` (`BUG-03`).
  - Clean up dead event listeners in `js/components/settings.js:461, 480` (`BUG-07`).
- **Target Files:** `js/services/firebase-sync.js`, `js/state.js`, `js/components/settings.js`.
- **Risk:** Medium. Alters Firestore write triggers and realtime listener filtering.
- **Prerequisite:** Phase 0 tests passing.

### Phase 2: Security & Privacy Hardening
- **Scope:**
  - Sanitize `toast.js:38` by using `textContent` for text insertion or explicit `escapeHtml(message)` (`BUG-08`).
  - Sanitize state payload in `js/services/export-import.js:10`: strip `firebaseUser`, `googleClientId`, `spreadsheetId`, and tokens before writing `.json` backup file.
  - Add `<meta http-equiv="Content-Security-Policy">` to `index.html`.
  - Add SRI hashes and version pins to CDN script tags in `index.html`.
- **Target Files:** `js/components/toast.js`, `js/services/export-import.js`, `index.html`.
- **Risk:** Low to Medium (strict CSP may block external CDNs if misconfigured).
- **Prerequisite:** Phase 0 verification.

### Phase 3: Money-Flow & Ledger Integrity
- **Scope:**
  - Update `deleteWallet()` in `js/state.js:243-250` to inspect `state.debts` and active repayments before allowing deletion (`BUG-05`).
  - Add repayment bound check in `js/state.js:316` and `js/components/debts.js:589` enforcing `amount <= debt.remainingAmount` (`BUG-09`).
  - Include `updatedAt` in `js/services/google-sheets.js:106, 210` (`BUG-06`).
  - Add `deleteBudget(categoryId, month)` method to `js/state.js` (`BUG-10`).
  - Dispatch budget sync when deleting categories in `js/state.js:283`.
- **Target Files:** `js/state.js`, `js/components/debts.js`, `js/services/google-sheets.js`.
- **Risk:** Medium. Affects balance calculations and debt repayment workflows.
- **Prerequisite:** Phase 0 unit tests for ledger calculation.

### Phase 4: Modularization (<200 Lines Standard)
- **Scope:**
  - Decompose `js/components/settings.js` (716 lines) into subcomponents: `settings-firebase.js`, `settings-google.js`, `settings-categories.js`, `settings-data.js`.
  - Decompose `js/components/debts.js` (597 lines) into `debts-list.js`, `debt-form-modal.js`, `debt-repay-modal.js`.
  - Decompose `js/components/transaction-modal.js` (485 lines) into `tx-form-modal.js` and `tx-debt-delegate.js`.
  - Extract `js/utils/base-modal.js` to centralize open, close, backdrop click, Escape key, and focus trap.
  - Split `css/components.css` (514 lines) into `css/components/buttons.css`, `cards.css`, `modals.css`.
- **Target Files:** `js/components/*.js`, `css/*.css`.
- **Risk:** High (regressions in DOM event bindings and styling).
- **Prerequisite:** Phases 1-3 completed; full smoke testing.

### Phase 5: PWA & Documentation Alignment
- **Scope:**
  - Add `./js/utils/privacy.js` to `ASSETS_TO_CACHE` in `sw.js:7-42` (`BUG-11`).
  - Update `CACHE_NAME` in `sw.js:6` to `'qlct-pwa-v2.3'`.
  - Update `sw.js` fetch handler to cache CORS responses from trusted CDNs (`unpkg.com`, `jsdelivr.net`, `gstatic.com`).
  - Rewrite `README.md`, `docs/system-architecture.md`, `docs/development-roadmap.md`, `docs/project-changelog.md` to accurately document Firebase synchronization and remove inaccurate IndexedDB claims.
- **Target Files:** `sw.js`, `README.md`, `docs/*.md`.
- **Risk:** Low.
- **Prerequisite:** None.

---

## 12. Unresolved Questions & Architectural Decisions

1. **Primary Cloud Identity:** Is Firebase Firestore intended to be the permanent primary cloud sync engine, or should Google Sheets remain the canonical source of truth? (Recommendation: Keep Firebase as realtime sync engine; treat Google Sheets as on-demand spreadsheet backup/export).
2. **Default Firebase Project Tenancy:** Should the hardcoded Firebase project `sothuchi-5f58e` in `js/config.js` remain as a public fallback demo, or should the app enforce user-provided Firebase configuration (consistent with the Google Client ID model)?
3. **Storage Engine Scalability:** Given that `js/services/storage.js` uses synchronous `localStorage` (subject to 5MB browser quota), should a future phase replace `StorageService` with a true asynchronous `IndexedDB` keyval store before users accumulate years of transaction data?
4. **Credit Card Liability Ledger Model:** Should negative balances on credit cards be aggregated into a "Tổng dư nợ thẻ" card on the Dashboard, rather than simply being omitted from "Tổng tài sản thực có"?
