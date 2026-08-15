/**
 * Service Worker for Progressive Web App (PWA)
 * Caches static shell and assets for instant loading and offline support.
 */

const CACHE_NAME = 'qlct-pwa-v2.2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layouts.css',
  './js/app.js',
  './js/config.js',
  './js/state.js',
  './js/components/dashboard.js',
  './js/components/transaction-list.js',
  './js/components/wallets.js',
  './js/components/debts.js',
  './js/components/budgets.js',
  './js/components/analytics.js',
  './js/components/settings.js',
  './js/components/transaction-modal.js',
  './js/components/sync-modal.js',
  './js/components/confirm-dialog.js',
  './js/components/toast.js',
  './js/services/storage.js',
  './js/services/export-import.js',
  './js/services/google-auth.js',
  './js/services/google-sheets.js',
  './js/services/firebase-auth.js',
  './js/services/firebase-sync.js',
  './js/utils/formatters.js',
  './js/utils/helpers.js',
  './js/utils/modal-a11y.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon.svg'
];

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
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
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-while-revalidate / Network-first strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Ignore Google OAuth or Google Sheets API requests (always live network)
  const url = event.request.url;
  if (url.includes('googleapis.com') || url.includes('accounts.google.com')) {
    return;
  }

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
        .catch(() => {
          // Fallback if offline
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
