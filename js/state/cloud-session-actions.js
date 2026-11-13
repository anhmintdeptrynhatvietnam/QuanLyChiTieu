/**
 * Firebase Auth, Cloud Session, Remote Sync & Bulk Import Actions for State Store
 */
import { DEFAULT_FIREBASE_CONFIG } from '../config.js';
import { firebaseAuthService } from '../services/firebase-auth.js';
import { firebaseSyncService } from '../services/firebase-sync.js';
import { prepareCloudSession } from '../services/cloud-session.js';
import { sanitizeLegacySettings } from '../domain/settings-migration.js';
import { sanitizeImportedSettings } from '../domain/export-sanitize.js';
import { SYNCED_SETTINGS_KEYS } from '../domain/sync-diff.js';

export async function initFirebase(store) {
  try {
    const config = store.state.settings?.firebaseConfig || DEFAULT_FIREBASE_CONFIG;
    await firebaseAuthService.init(config);
    firebaseAuthService.onAuthChange(async (user) => {
      // Ignore results of an older auth event if a newer one arrived meanwhile.
      const seq = ++store.authSeq;
      store.state.settings.firebaseUser = user;

      if (!user) {
        firebaseSyncService.stopSync();
        store.saveToStorage();
        store.listeners.forEach(fn => fn('auth:changed', user, store.state));
        return;
      }

      firebaseSyncService.stopSync();
      store.saveToStorage();
      store.listeners.forEach(fn => fn('auth:changed', user, store.state));

      try {
        const ui = await store.cloudSessionUiReady;
        const session = await prepareCloudSession({
          uid: user.uid,
          getState: () => store.state,
          replaceLocal: (collections) => store.replaceLocalCollections(collections),
          ui
        });
        if (seq !== store.authSeq) return;
        if (!session.proceed) {
          firebaseSyncService.updateStatus('error', 'Dữ liệu Cloud cần được nâng cấp trước khi đồng bộ (đăng nhập lại để nâng cấp).');
          return;
        }
        firebaseSyncService.startSync(user.uid, {
          getState: () => store.state,
          applyCollection: (c, r) => store.applyRemoteCollection(c, r)
        });
      } catch (err) {
        console.error('Lỗi chuẩn bị phiên đồng bộ Cloud:', err);
        firebaseSyncService.updateStatus('error', 'Lỗi chuẩn bị đồng bộ Cloud: ' + err.message);
      }
    });
  } catch (err) {
    console.warn('Khởi tạo Firebase thất bại:', err);
    firebaseSyncService.updateStatus('offline', 'Offline / chưa tải được Cloud');
  }
}

export function replaceLocalCollections(store, collections) {
  for (const key of ['transactions', 'wallets', 'categories', 'budgets', 'debts']) {
    if (Array.isArray(collections[key])) store.state[key] = collections[key];
  }
  store.recalculateWalletBalances();
  store.saveToStorage();
  store.listeners.forEach(fn => fn('data:replaced', null, store.state));
}

export function applyRemoteCollection(store, collection, records) {
  if (!records) return;
  if (collection === 'settings') {
    const settingsRecord = Array.isArray(records) ? records[0] : records;
    if (settingsRecord && typeof settingsRecord === 'object') {
      const mergedSettings = { ...store.state.settings };
      for (const key of SYNCED_SETTINGS_KEYS) {
        if (settingsRecord[key] !== undefined) {
          mergedSettings[key] = settingsRecord[key];
        }
      }
      store.state.settings = mergedSettings;
    }
  } else {
    store.state[collection] = records;
  }

  if (['transactions', 'wallets', 'debts'].includes(collection)) {
    store.recalculateWalletBalances();
  }

  store.saveToStorage();
  store.listeners.forEach(fn => fn('remote:synced', { collection }, store.state));
}

export function updateSettings(store, partialSettings) {
  store.state.settings = { ...store.state.settings, ...partialSettings };
  store.notify('settings:updated', store.state.settings);
}

export function importAllData(store, payload) {
  if (payload.transactions) {
    const seen = new Set();
    store.state.transactions = payload.transactions.filter(t => {
      if (!t.id || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }
  if (payload.wallets) {
    const seen = new Set();
    store.state.wallets = payload.wallets.filter(w => {
      if (!w.id || seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    });
  }
  if (payload.categories) {
    const seen = new Set();
    store.state.categories = payload.categories.filter(c => {
      if (!c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }
  if (payload.budgets) store.state.budgets = payload.budgets;
  if (payload.debts) {
    const seen = new Set();
    store.state.debts = payload.debts.filter(d => {
      if (!d.id || seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }
  if (payload.settings) {
    store.state.settings = { ...store.state.settings, ...sanitizeLegacySettings(sanitizeImportedSettings(payload.settings)) };
  }

  store.recalculateWalletBalances();
  store.notify('data:imported', store.state);
}
