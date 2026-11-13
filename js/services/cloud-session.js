/**
 * Prepares local state and the cloud layout when a Firebase user signs in,
 * before realtime sync starts: legacy migration, account switch and first sign-in choices.
 * UI interactions (confirm dialogs, backup download, toasts) are injected by the app.
 */
import { StorageService } from './storage.js';
import { firebaseSyncService } from './firebase-sync.js';
import { getCloudSchemaState, migrateLegacyData, markSchemaCurrent } from './firebase-migration.js';
import { decideOnSignIn, hasUserLocalData, freshLocalCollections } from '../domain/account-switch.js';
import { DEFAULT_WALLETS, DEFAULT_CATEGORIES } from '../config.js';

export const LAST_AUTH_UID_KEY = 'qlct_last_auth_uid';

/** UI used when the app has not registered one (e.g. tests): never confirms anything destructive. */
export const HEADLESS_SESSION_UI = {
  confirm: async () => false,
  backupLocal: () => {},
  notify: (message) => console.info(message)
};

/**
 * @param {Object} params
 * @param {string} params.uid
 * @param {() => Object} params.getState
 * @param {(collections: Object) => void} params.replaceLocal - replaces local collections
 * @param {{ confirm: Function, backupLocal: Function, notify: Function }} [params.ui]
 * @returns {Promise<{ proceed: boolean, decision?: string, reason?: string }>}
 */
export async function prepareCloudSession({ uid, getState, replaceLocal, ui = HEADLESS_SESSION_UI }) {
  const schema = await getCloudSchemaState(uid);

  if (schema.state === 'legacy') {
    const ok = await ui.confirm(
      'Dữ liệu Cloud của tài khoản này đang ở định dạng cũ và cần nâng cấp trước khi đồng bộ. ' +
      'Hệ thống sẽ tải về file sao lưu (.JSON) dữ liệu trên máy này trước, dữ liệu Cloud cũ vẫn được giữ nguyên.',
      { title: 'Nâng cấp dữ liệu Cloud', confirmText: 'Sao lưu & nâng cấp', cancelText: 'Để sau' }
    );
    if (!ok) return { proceed: false, reason: 'migration-declined' };
    ui.backupLocal();
    const stats = await migrateLegacyData(uid, schema.legacyDocs);
    ui.notify(`Đã nâng cấp dữ liệu Cloud (${stats.transactions.kept} giao dịch, ${stats.debts.kept} khoản vay/nợ).`, 'success');
  } else if (schema.state === 'empty') {
    await markSchemaCurrent(uid);
  }

  const cloudHasData = await firebaseSyncService.checkHasCloudDataForUser(uid);
  const lastUid = StorageService.get(LAST_AUTH_UID_KEY);
  const decision = decideOnSignIn({ lastUid, uid, localHasData: hasUserLocalData(getState()), cloudHasData });
  // Replacing local data wholesale must also drop the baseline for this uid,
  // or the emptied local state would be pushed as deletions of every cloud record.
  const replaceWithFresh = (hasCloud) => {
    firebaseSyncService.clearBaseline(uid);
    replaceLocal(freshLocalCollections({
      cloudHasData: hasCloud,
      defaultWallets: DEFAULT_WALLETS,
      defaultCategories: DEFAULT_CATEGORIES
    }));
  };

  if (decision === 'reset-local') {
    replaceWithFresh(cloudHasData);
  } else if (decision === 'ask-user') {
    const useCloud = await ui.confirm(
      'Thiết bị này và Cloud đều đang có dữ liệu. Chọn "Dùng dữ liệu Cloud" để thay dữ liệu trên máy bằng dữ liệu Cloud ' +
      '(hệ thống sẽ tải về file sao lưu dữ liệu trên máy trước).',
      { title: 'Chọn dữ liệu để sử dụng', confirmText: 'Dùng dữ liệu Cloud', cancelText: 'Lựa chọn khác' }
    );
    if (useCloud) {
      ui.backupLocal();
      replaceWithFresh(true);
    } else {
      const overwrite = await ui.confirm(
        'Ghi đè TOÀN BỘ dữ liệu Cloud bằng dữ liệu trên máy này? Chọn "Gộp cả hai" để giữ dữ liệu của cả hai bên.',
        { title: 'Ghi đè dữ liệu Cloud?', confirmText: 'Ghi đè Cloud', cancelText: 'Gộp cả hai', danger: true }
      );
      if (overwrite) await firebaseSyncService.pushAllData(getState(), uid);
    }
  }

  StorageService.set(LAST_AUTH_UID_KEY, uid);
  return { proceed: true, decision };
}
