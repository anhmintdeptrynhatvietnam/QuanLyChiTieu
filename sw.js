/**
 * Service Worker for Progressive Web App (PWA)
 * Caches static shell and assets for instant loading and offline support.
 */

const CACHE_NAME = 'qlct-pwa-v2.9';
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
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layouts.css',
  './css/ui.css',
  './js/app.js',
  './js/config.js',
  './js/state.js',
  './js/domain/ledger.js',
  './js/domain/debt-rules.js',
  './js/domain/settings-migration.js',
  './js/domain/sync-diff.js',
  './js/domain/legacy-migration.js',
  './js/domain/account-switch.js',
  './js/domain/export-sanitize.js',
  './js/components/dashboard.js',
  './js/components/transaction-list.js',
  './js/components/wallets.js',
  './js/components/debts.js',
  './js/components/budgets.js',
  './js/components/analytics.js',
  './js/components/settings.js',
  './js/components/transaction-modal.js',
  './js/components/confirm-dialog.js',
  './js/components/toast.js',
  './js/services/storage.js',
  './js/services/export-import.js',
  './js/services/firebase-auth.js',
  './js/services/firebase-sdk.js',
  './js/services/firebase-migration.js',
  './js/services/cloud-session.js',
  './js/services/firebase-sync.js',
  './js/utils/formatters.js',
  './js/utils/helpers.js',
  './js/utils/modal-a11y.js',
  './js/utils/privacy.js',
  './js/ui/bottom-sheet.js',
  './js/ui/category-grid.js',
  './js/ui/currency-input.js',
  './js/ui/icons.js',
  './js/ui/theme.js',
  './js/ui/wallet-picker.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon.svg'
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
