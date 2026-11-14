/**
 * Hide the screens while a signed-in, online device fetches the latest cloud data on
 * startup, so numbers saved on another device are not shown stale and then replaced.
 * Offline or signed-out devices show local data immediately; a slow network falls
 * back to local data after MAX_WAIT_MS.
 */
import { stateStore } from '../state.js';
import { firebaseSyncService } from '../services/firebase-sync.js';

const MAX_WAIT_MS = 5000;
const PENDING_CLASS = 'data-pending';
// 'connected' is only reported once every collection has merged a server snapshot.
const DONE_STATUSES = new Set(['connected', 'error', 'offline']);

export function initInitialSyncGate() {
  const wasSignedIn = Boolean(stateStore.getState().settings?.firebaseUser);
  if (!wasSignedIn || !navigator.onLine) return;

  const root = document.documentElement;
  root.classList.add(PENDING_CLASS);

  let unsubscribeStatus = () => {};
  let timer = null;
  let done = false;
  const reveal = () => {
    if (done) return;
    done = true;
    root.classList.remove(PENDING_CLASS);
    clearTimeout(timer);
    unsubscribeStatus();
    window.removeEventListener('offline', reveal);
  };

  timer = setTimeout(reveal, MAX_WAIT_MS);
  window.addEventListener('offline', reveal);
  unsubscribeStatus = firebaseSyncService.onStatusChange((status) => {
    if (DONE_STATUSES.has(status.status)) reveal();
  });
  stateStore.subscribe((event, user) => {
    if (event === 'auth:changed' && !user) reveal(); // signed out meanwhile
  });
}
