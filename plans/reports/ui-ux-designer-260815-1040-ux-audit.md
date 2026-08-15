# UI/UX Audit: Sổ Thu Chi (Personal Finance Tracker)

Date: 2026-08-15. Scope: audit only, no files modified. Findings verified by
reading `index.html`, `css/*.css`, `js/app.js`, `js/config.js`, all
`js/components/*.js` and `docs/*.md`.

## High Impact

1. **Native `alert()`/`confirm()`/`prompt()` used for all validation, errors,
   destructive confirmations, and even help content** (long guide text dumped
   into `alert()`). Files: `transaction-modal.js` (L152,397,410,426,444),
   `wallets.js` (L220,267), `debts.js` (L390,489,497), `settings.js`
   (L239,258,271,279,286,307,322,348,357,371,397-398,406,414-435),
   `sync-modal.js` (L201,236,245,258,277,286). Why it matters: breaks the
   app's visual language (unstyled system dialog, ignores light/dark theme),
   blocks the JS thread, can't show Vietnamese diacritics reliably on some
   platforms, and is jarring on a PWA meant to feel native. A `showToast`
   system already exists but error paths bypass it. Fix direction: build one
   reusable themed confirm-dialog + inline-validation pattern (reuse the
   existing `.modal-overlay`/`.modal-content` markup) and route all error
   paths through `showToast(..., 'error')` instead of `alert()`.

2. **Icon system inconsistency: emoji mixed with Lucide SVG icons** as
   first-class UI icons, not just copy decoration. Files: `transaction-modal.js`
   (💸💰🔄🤝🔵🟢🟠🔴 on tab/action buttons), `debts.js` (🔵🟠✓📅⏰📝✨),
   `settings.js` (📖🔻🔺📲⚠️), `sync-modal.js` (📊💳🏷️🤝✅❌⚠️). Why it
   matters: emoji glyphs render with a different visual weight/style per OS
   (Windows/Android/iOS/Linux fonts differ), clash with the deliberately
   flat, tokenized Lucide icon set used everywhere else, and undermine the
   "award-worthy" polish the rest of the design achieves. Fix direction:
   replace every functional emoji with a Lucide icon + CSS color token
   (e.g. `--income-primary`/`--expense-primary`) sized like other icons.

3. **No visible focus/dialog semantics on modals; no Escape-to-close; no
   `aria-*` anywhere in the app.** Verified: zero `aria-`, `role=`, or
   `prefers-reduced-motion` occurrences in any `js/`, `css/`, or `index.html`
   file. Icon-only buttons (modal close `×`, edit, delete) have no
   `aria-label` — only a `title` attribute, which many screen readers do not
   reliably expose as an accessible name for buttons whose only content is an
   `<i>` icon. `.modal-overlay` divs have no `role="dialog"`/`aria-modal`, and
   none of the 5 modal components (`transaction-modal.js`, `wallets.js`,
   `budgets.js`, `debts.js` ×2, `sync-modal.js`) bind an `Escape` keydown
   handler — only backdrop-click closes them. Why it matters: keyboard/screen
   reader users cannot reliably identify or dismiss modals in a data-entry-
   heavy finance app. Fix direction: add `role="dialog" aria-modal="true"
   aria-labelledby="<title-id>"` to `.modal-overlay`, `aria-label` on every
   icon-only button, and a shared `Escape`-to-close handler.

4. **`--bg-card` CSS variable is used but never defined** in
   `css/variables.css` (confirmed by full-repo grep — the only two references
   are in `js/components/sync-modal.js` lines 49 and 76:
   `background: var(--bg-card)`). Why it matters: this is an actual rendering
   bug, not a style preference — the two sync-option cards in the "Đồng Bộ
   Google Sheets" modal get an invalid/transparent background instead of a
   surface color, breaking contrast against whatever is behind the modal.
   Fix direction: replace with the existing `var(--bg-surface)` token (or add
   `--bg-card` to `variables.css` if a distinct tint is intended).

5. **Loading spinner animation is not defined anywhere in the project's
   CSS.** `sync-modal.js` (L107) sets `animation: spin 0.8s linear infinite`
   inline, but `@keyframes spin` does not exist in `css/base.css`,
   `components.css`, or `layouts.css` (confirmed by grep — only unrelated
   `.claude/.agent` skill files define a `spin` keyframe). Why it matters:
   during Google Sheets push/pull — the app's only real async, wait-worthy
   operation — the "loading" indicator is a static ring, giving users no
   feedback that anything is happening; on a slow connection this reads as
   "frozen," which is risky right before a destructive data-overwrite pull.
   Fix direction: add a `@keyframes spin` rule (and a reusable `.spinner`
   class) to `components.css`.

6. **Destructive "Reset Data" sits visually equal to routine export/import
   actions.** `settings.js` L196-217: `btn-export-json`, `btn-export-csv`,
   `import` label, and `btn-reset-data` (`.btn-danger`) are laid out in the
   same `repeat(auto-fit, minmax(200px,1fr))` grid with equal size/weight,
   guarded only by one `confirm()`. Why it matters: this button permanently
   wipes all local data (`localStorage.clear()`); equal visual weight plus a
   single native confirm makes it too easy to trigger by mis-tap, especially
   on mobile where the grid can reflow to one wide column. Fix direction:
   separate it into its own "Danger Zone" card section with extra friction
   (e.g. type-to-confirm) consistent with the rest of the design system.

## Medium Impact

7. **Icon buttons shrunk well below the 44×44px touch-target minimum**, via
   inline `style` overrides of the shared `.btn-icon` (already 40px in
   `components.css`). Edit/delete buttons: `transaction-list.js` L167,170
   (32×32px), `wallets.js` L139,142 (28×28px), `debts.js` L246,249 (28×28px).
   Why it matters: this is a finance app used one-handed on phones; a 28px
   delete button next to a 28px edit button on a wallet/debt card is easy to
   mis-tap, and mis-tapping "delete" on a wallet/debt is high-consequence.
   Fix direction: enforce a single `--touch-target-min: 44px` token and stop
   overriding `.btn-icon` dimensions per-file; use spacing instead of
   shrinking the buttons to avoid crowding cards.

8. **`.badge` class reused as an interactive tab/filter/chip control** in
   at least 4 places: `transaction-modal.js` debt-action buttons (L43-46) and
   quick-amount chips (L59-62), `debts.js` filter pills (L177-181). Why it
   matters: badges were designed as small status pills (padding
   `0.25rem 0.625rem`, `font-size: xs`); reused as buttons their touch target
   is far under 44px and they're semantically confusing (a "badge" that
   toggles state). Fix direction: add a dedicated `.chip`/`.pill-btn`
   component in `components.css` with adequate padding and `:focus-visible`
   styling, distinct from the read-only `.badge`.

9. **No `:focus-visible` styling anywhere except form inputs.**
   `components.css` only defines focus for `.form-input/.form-select/
   .form-textarea` (L110-114). Buttons, nav links (`.nav-link`,
   `.mobile-nav-item`), and the clickable `#sync-status-badge` have no
   explicit focus ring, relying entirely on browser defaults, which are
   inconsistent across browsers and easy to accidentally suppress later. Why
   it matters: keyboard navigation through the sidebar/bottom-nav/action
   buttons has no guaranteed, on-brand focus indicator. Fix direction: add a
   shared `:focus-visible { outline: 2px solid var(--primary-500); outline-
   offset: 2px; }` rule covering `.btn`, `.nav-link`, `.mobile-nav-item`,
   `.badge` in `base.css`.

10. **Chart.js legend/axis label colors are never set, so they don't follow
    the theme.** `analytics.js` `initCharts()` (L184, L228) only customizes
    `boxWidth`/`font.family` for the legend and a value-formatting callback
    for the Y-axis — no `color` option is passed anywhere, so Chart.js falls
    back to its own default gray. Also, charts are not re-created when the
    theme toggles (theme toggle in `app.js` never calls `stateStore`, so
    `Analytics`'s state-subscription re-render never fires) — the doughnut's
    `borderColor` (read once from `data-theme` at render time) can go stale
    if the user switches themes while on the Analytics tab. Why it matters:
    in dark theme, default Chart.js label gray reads poorly against
    `--bg-surface: #111827`, hurting legibility of the two main financial
    charts. Fix direction: pass `color: getComputedStyle(document.
    documentElement).getPropertyValue('--text-secondary')` (or similar) into
    `plugins.legend.labels` and `scales.y.ticks`, and re-run `initCharts()`
    from the theme-toggle handler when the Analytics view is active.

11. **`sync-modal.js` uses a different open/close mechanism than every other
    modal** — toggling `style.display = 'flex'/'none'` directly (L296,301)
    instead of the shared `.modal-overlay.active` class used by
    `transaction-modal.js`, `wallets.js`, `budgets.js`, `debts.js`. Why it
    matters: the Google Sync modal — arguably the highest-stakes modal in the
    app (it can overwrite all local data) — skips the fade/scale-in
    transition (`components.css` L170-196) that every other modal gets,
    making it feel like a different, less-polished part of the app. Fix
    direction: convert `SyncModal` to use `.active` toggling like the others.

12. **Duplicated ad-hoc color tokens instead of existing CSS variables.**
    Examples: `debts.js` L231 hardcodes
    `background: rgba(16, 185, 129, 0.15); color: #10b981;` for the "paid"
    badge instead of the existing `.badge-income`/`--income-bg`/
    `--income-text` tokens; `sync-modal.js` L86 hardcodes
    `background: rgba(245, 158, 11, 0.12); color: #d97706;` duplicating
    `--warning-bg`/`--warning-text`; `settings.js` defines its own inline
    `colors` array (L244-246) for new-category colors instead of reusing the
    already-exported `CATEGORY_PALETTE` from `config.js` (used by
    `analytics.js`). Why it matters: color decisions drift from the design
    tokens over time and dark-mode support silently breaks wherever a hex
    value is hardcoded (the token versions already adapt per-theme; the
    hardcoded ones don't). Fix direction: replace literal colors with the
    existing CSS variables/`CATEGORY_PALETTE` constant; treat any new literal
    hex/rgba in a component file as a signal to add or reuse a token instead.

13. **Modal dialogs are a fixed centered card on all breakpoints**, not a
    mobile bottom-sheet. `components.css` `.modal-content` (L180-196) has no
    mobile-specific layout in `layouts.css`'s `@media (max-width: 768px)`
    block. Why it matters: the app's primary mobile action is the FAB
    (bottom-right, thumb-reachable) opening the transaction modal, which is a
    long form (type tabs, amount, category, wallet, date, debt sub-fields);
    on a phone it currently opens as a padded, vertically-centered card
    requiring reach-and-scroll rather than a slide-up sheet anchored to the
    bottom, which is the now-standard ergonomic pattern for quick-entry
    finance apps. Fix direction: add a mobile breakpoint variant of
    `.modal-content` that docks to the bottom of the viewport with a
    slide-up transition (respecting `prefers-reduced-motion`).

## Low Impact

14. **`user-scalable=no, maximum-scale=1.0`** in `index.html` L5 disables
    pinch-zoom. Why it matters: WCAG 1.4.4 (Resize Text) expects users to be
    able to zoom; for a numbers-heavy finance app this can matter for
    low-vision users. Fix direction: drop `user-scalable=no` and
    `maximum-scale=1.0` (PWA "app-like" feel can still be achieved without
    blocking zoom).

15. **Heavy reliance on per-render inline `style="..."` attributes** across
    every component file instead of component classes in `components.css`
    (e.g. repeated `style="font-size: var(--font-size-sm);"`,
    `style="width: 14px; height: 14px;"`, ad hoc
    `grid-template-columns: repeat(auto-fit, minmax(Npx, 1fr))` repeated in
    `dashboard.js`, `wallets.js`, `debts.js`). Why it matters: not a visible
    bug today, but it's the root cause of items #7, #8, #12 above — every
    inline override is a place a future edit can silently drift from the
    design system. Fix direction: extract the most-repeated inline patterns
    (icon-avatar circle, auto-fit card grid, stat-card) into named classes in
    `components.css`/`layouts.css`.

16. **`.btn-icon` reused as a non-interactive decorative icon-avatar** in
    `dashboard.js` (L166), `transaction-list.js` (L151), `budgets.js` (L140)
    — applied to a plain `<div>`, not a button. Why it matters: minor
    semantic confusion (a class literally named "button icon" wrapping
    non-interactive decoration) that also makes item #7's fix (raising the
    real button's touch target) harder to apply safely without a separate
    class. Fix direction: introduce a separate `.icon-avatar` class for
    decorative icon circles, keep `.btn-icon` for actual `<button>`s.

17. **Every field/entity-editing component (`transaction-modal.js`,
    `wallets.js`, `budgets.js`, `debts.js`) hand-rolls its own nearly
    identical modal open/close/backdrop-click/focus-delay wiring** (all use
    the same `setTimeout(() => input.focus(), 150)` pattern). This is more of
    an engineering DRY note than a pure UX one, but it's the reason #11
    (sync-modal inconsistency) exists — a shared base modal helper would make
    that class of drift structurally impossible. Fix direction: extract a
    small `BaseModal` helper (open/close/`.active` toggle/backdrop-click/
    Escape/focus-first-field) that all 5 modals compose.

## Unresolved Questions

- Whether the Chart.js label-color fix should read live CSS variables at
  chart-creation time, or the app should switch to storing a small
  JS-side theme-color map — depends on whether more Chart.js instances are
  planned; flagging for whoever picks this up rather than guessing scope.
- Whether the destructive-action redesign (#6) should follow a specific
  existing pattern from another view, or introduce a new "danger zone"
  convention — no precedent exists elsewhere in the app to match against.

Status: DONE
Summary: Read all in-scope files (index.html, css/*, app.js, config.js, all js/components/*.js, docs/*) and produced a 17-item prioritized audit (6 high, 7 medium, 4 low) covering native-dialog UX, emoji/icon inconsistency, two verified real bugs (`--bg-card` undefined, missing `@keyframes spin`), touch-target sizes, focus/aria gaps, and token/color drift — no files modified.
