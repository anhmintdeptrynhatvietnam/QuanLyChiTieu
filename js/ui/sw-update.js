/**
 * Service worker registration with automatic reload on a new release.
 * The SW skips waiting and claims clients, so `controllerchange` fires once the
 * new version is active; reloading then serves the fresh precache. The first
 * install (page had no controller) never reloads, and an open bottom sheet
 * postpones the reload so a half-typed entry is not lost.
 */

const SHEET_SELECTOR = '.sheet-backdrop';
const SHEET_POLL_MS = 1000;

function reloadWhenIdle() {
  if (!document.querySelector(SHEET_SELECTOR)) {
    window.location.reload();
    return;
  }
  setTimeout(reloadWhenIdle, SHEET_POLL_MS);
}

export function registerServiceWorker(scriptUrl = './sw.js') {
  if (!('serviceWorker' in navigator)) return;

  const hadController = !!navigator.serviceWorker.controller;
  let reloadScheduled = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloadScheduled) return;
    reloadScheduled = true;
    reloadWhenIdle();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(scriptUrl)
      .then((reg) => {
        // An installed PWA can stay open for days: look for a new release when it comes back to the foreground.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      })
      .catch((err) => console.warn('PWA Service Worker registration failed:', err));
  });
}
