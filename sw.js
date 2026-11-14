/**
 * Service Worker for Progressive Web App (PWA)
 * Caches static shell and assets for instant loading and offline support.
 */

const CACHE_NAME = 'qlct-pwa-v2.22';
const CDN_CACHE = 'qlct-cdn-v1';

const CDN_HOSTS = new Set([
  'unpkg.com',
  'cdn.jsdelivr.net',
  'www.gstatic.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]);

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon.svg',
  './css/base.css',
  './css/components.css',
  './css/layouts.css',
  './css/sheets.css',
  './css/ui.css',
  './css/variables.css',
  './css/views/analytics.css',
  './css/views/budgets.css',
  './css/views/dashboard.css',
  './css/views/debts.css',
  './css/views/settings.css',
  './css/views/transactions.css',
  './css/views/wallets.css',
  './js/app.js',
  './js/components/confirm-dialog.js',
  './js/components/toast.js',
  './js/config.js',
  './js/domain/account-switch.js',
  './js/domain/analytics-series.js',
  './js/domain/balance-reconcile.js',
  './js/domain/budget-progress.js',
  './js/domain/debt-rules.js',
  './js/domain/export-sanitize.js',
  './js/domain/ledger.js',
  './js/domain/legacy-migration.js',
  './js/domain/period-summary.js',
  './js/domain/push-diff.js',
  './js/domain/record-hash.js',
  './js/domain/remote-merge.js',
  './js/domain/settings-migration.js',
  './js/domain/snapshot-changes.js',
  './js/domain/sync-diff.js',
  './js/domain/transaction-entry.js',
  './js/domain/transaction-query.js',
  './js/services/cloud-session.js',
  './js/services/export-import.js',
  './js/services/firebase-auth.js',
  './js/services/firebase-migration.js',
  './js/services/firebase-sdk.js',
  './js/services/firebase-sync-listeners.js',
  './js/services/firebase-sync-ops.js',
  './js/services/firebase-sync-pull.js',
  './js/services/firebase-sync.js',
  './js/services/storage.js',
  './js/state.js',
  './js/state/category-budget-actions.js',
  './js/state/cloud-session-actions.js',
  './js/state/debt-actions.js',
  './js/state/persistence.js',
  './js/state/transaction-actions.js',
  './js/state/wallet-actions.js',
  './js/ui/bottom-sheet.js',
  './js/ui/category-grid.js',
  './js/ui/currency-input.js',
  './js/ui/icons.js',
  './js/ui/initial-sync-gate.js',
  './js/ui/router.js',
  './js/ui/sw-update.js',
  './js/ui/sync-badge.js',
  './js/ui/theme.js',
  './js/ui/transaction-row.js',
  './js/ui/wallet-picker.js',
  './js/utils/formatters.js',
  './js/utils/helpers.js',
  './js/utils/modal-a11y.js',
  './js/utils/privacy.js',
  './js/views/analytics/analytics-breakdown.js',
  './js/views/analytics/analytics-charts.js',
  './js/views/analytics/analytics-view.js',
  './js/views/budgets/budget-item.js',
  './js/views/budgets/budget-sheet.js',
  './js/views/budgets/budgets-view.js',
  './js/views/dashboard/dashboard-cards.js',
  './js/views/dashboard/dashboard-view.js',
  './js/views/debt-sheet/debt-form-template.js',
  './js/views/debt-sheet/debt-form.js',
  './js/views/debt-sheet/debt-picker.js',
  './js/views/debt-sheet/debt-sheet.js',
  './js/views/debts/debt-card.js',
  './js/views/debts/debt-detail-sheet.js',
  './js/views/debts/debt-edit-sheet.js',
  './js/views/debts/debts-view.js',
  './js/views/more/more-view.js',
  './js/views/settings/settings-account.js',
  './js/views/settings/settings-appearance.js',
  './js/views/settings/settings-categories.js',
  './js/views/settings/settings-data.js',
  './js/views/settings/settings-firebase-config.js',
  './js/views/settings/settings-pwa.js',
  './js/views/settings/settings-view.js',
  './js/views/transaction-sheet/category-create.js',
  './js/views/transaction-sheet/last-entry.js',
  './js/views/transaction-sheet/transaction-form-template.js',
  './js/views/transaction-sheet/transaction-form.js',
  './js/views/transaction-sheet/transaction-save.js',
  './js/views/transaction-sheet/transaction-sheet.js',
  './js/views/transactions/transactions-filter-sheet.js',
  './js/views/transactions/transactions-header.js',
  './js/views/transactions/transactions-list-renderer.js',
  './js/views/transactions/transactions-view.js',
  './js/views/wallets/wallet-balance-field.js',
  './js/views/wallets/wallet-sheet.js',
  './js/views/wallets/wallets-view.js'
];

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Bypass the HTTP cache so a new release never precaches stale files.
      return cache.addAll(ASSETS_TO_CACHE.map((url) => new Request(url, { cache: 'reload' }))).catch((err) => {
        console.warn('Some assets could not be pre-cached:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== CDN_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Caching strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // Same-origin GET: cache-first + background refresh
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(async () => {
            if (cachedResponse) {
              return cachedResponse;
            }
            if (event.request.mode === 'navigate') {
              const indexResponse = await caches.match('./index.html');
              if (indexResponse) {
                return indexResponse;
              }
            }
            return Response.error();
          });

        if (cachedResponse) {
          event.waitUntil(fetchPromise.catch(() => {}));
          return cachedResponse;
        }

        return fetchPromise;
      })
    );
    return;
  }

  // Cross-origin GET whose host is in an allowlist: stale-while-revalidate into CDN_CACHE
  if (CDN_HOSTS.has(url.hostname)) {
    event.respondWith(
      caches.open(CDN_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === 'cors' || networkResponse.type === 'basic')
            ) {
              const responseToCache = networkResponse.clone();
              cache.put(event.request, responseToCache);
            }
            return networkResponse;
          });

        if (cachedResponse) {
          event.waitUntil(fetchPromise.catch(() => {}));
          return cachedResponse;
        }

        return fetchPromise.catch(() => Response.error());
      })
    );
    return;
  }

  // Any other cross-origin request: pass through without respondWith
});
