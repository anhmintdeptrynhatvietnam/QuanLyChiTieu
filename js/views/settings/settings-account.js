/**
 * Settings Section: Account & Firebase Cloud Sync
 */
import { stateStore } from '../../state.js';
import { firebaseAuthService } from '../../services/firebase-auth.js';
import { firebaseSyncService } from '../../services/firebase-sync.js';
import { ExportImportService } from '../../services/export-import.js';
import { showToast } from '../../components/toast.js';
import { confirmDialog } from '../../components/confirm-dialog.js';
import { escapeHtml } from '../../utils/helpers.js';
import { DEFAULT_FIREBASE_CONFIG } from '../../config.js';
import { renderFirebaseConfigForm, bindFirebaseConfigEvents } from './settings-firebase-config.js';

export function renderAccountSection(state) {
  const fbUser = firebaseAuthService.getCurrentUser() || state.settings?.firebaseUser;
  const fbStatus = firebaseSyncService.getStatus();
  const isFbConnected = !!fbUser && (fbStatus.status === 'connected' || fbStatus.status === 'syncing');
  const fbConfig = state.settings?.firebaseConfig || DEFAULT_FIREBASE_CONFIG;
  const isHttpsAvatar = fbUser?.photoURL && typeof fbUser.photoURL === 'string' && fbUser.photoURL.startsWith('https://');

  return `
    <div class="card-v2 settings-account-card">
      <div class="settings-card-header">
        <div class="badge ${isFbConnected ? 'badge-income' : 'badge-subtle'}">
          <i data-lucide="${isFbConnected ? 'zap' : 'cloud-off'}" style="width: 15px; height: 15px; ${isFbConnected ? 'color: var(--income-primary);' : ''}"></i>
          <span>${isFbConnected ? '⚡ Đã kết nối Cloud' : 'Chưa kết nối Cloud'}</span>
        </div>
        ${fbStatus.lastSync ? `
          <span class="text-muted" style="font-size: 11px;">
            Đồng bộ: ${new Date(fbStatus.lastSync).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        ` : ''}
      </div>

      <p class="text-secondary settings-account-desc">
        Đồng bộ dữ liệu tức thì giữa máy tính và điện thoại. Tự động lưu offline khi mất mạng và tự đồng bộ khi có kết nối trở lại.
      </p>

      ${fbUser ? `
        <div class="card-v2 settings-user-profile">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 12px;">
            <div class="flex items-center gap-3">
              ${isHttpsAvatar ? `
                <img src="${escapeHtml(fbUser.photoURL)}" alt="Avatar" class="settings-user-avatar">
              ` : `
                <div class="settings-user-avatar-fallback">
                  ${escapeHtml((fbUser.displayName || 'U')[0].toUpperCase())}
                </div>
              `}
              <div>
                <div class="font-semibold" style="font-size: var(--font-size-sm); color: var(--text-primary);">
                  ${escapeHtml(fbUser.displayName || 'Người dùng')} ${fbUser.isAnonymous ? '<span class="badge badge-subtle" style="font-size: 10px;">Ẩn danh</span>' : ''}
                </div>
                <div class="text-muted" style="font-size: 11px;">${escapeHtml(fbUser.email || 'UID: ' + fbUser.uid.substring(0, 8) + '...')}</div>
              </div>
            </div>
            <button type="button" class="btn-v2 btn-v2-secondary" id="btn-firebase-signout" style="padding: 6px 12px; font-size: var(--font-size-xs);">
              <i data-lucide="log-out" style="width: 14px; height: 14px;"></i>
              <span>Đăng Xuất</span>
            </button>
          </div>

          ${isFbConnected ? `
            <div class="flex gap-2" style="flex-wrap: wrap; margin-top: var(--space-3); border-top: 1px solid var(--border-subtle); padding-top: var(--space-3);">
              <button type="button" class="btn-v2 btn-v2-secondary" id="btn-firebase-push-all" style="padding: 6px 12px; font-size: var(--font-size-xs);">
                <i data-lucide="cloud-upload" style="width: 14px; height: 14px;"></i>
                <span>Đẩy toàn bộ lên Cloud</span>
              </button>
              <button type="button" class="btn-v2 btn-v2-secondary" id="btn-firebase-pull-all" style="padding: 6px 12px; font-size: var(--font-size-xs);">
                <i data-lucide="cloud-download" style="width: 14px; height: 14px;"></i>
                <span>Kéo toàn bộ về máy</span>
              </button>
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="flex gap-2" style="flex-wrap: wrap;">
          <button type="button" class="btn-v2 btn-v2-primary" id="btn-firebase-login-google">
            <i data-lucide="log-in" style="width: 16px; height: 16px;"></i>
            <span>Đăng Nhập Google</span>
          </button>
          <button type="button" class="btn-v2 btn-v2-secondary" id="btn-firebase-login-guest">
            <i data-lucide="user-check" style="width: 16px; height: 16px;"></i>
            <span>Dùng Thử Ẩn Danh</span>
          </button>
        </div>
      `}

      <!-- Custom Firebase Config -->
      ${renderFirebaseConfigForm(fbConfig)}
    </div>
  `;
}

export function bindAccountEvents(container) {
  // Sign in Google
  container.querySelector('#btn-firebase-login-google')?.addEventListener('click', async () => {
    try {
      showToast('Đang mở cửa sổ đăng nhập Google...', 'info');
      const user = await firebaseAuthService.signInWithGoogle();
      showToast(`Chào mừng ${user.displayName || 'bạn'}! Đã kết nối Cloud thành công ⚡`, 'success');
    } catch (err) {
      showToast('Lỗi đăng nhập: ' + err.message, 'error');
    }
  });

  // Sign in Guest
  container.querySelector('#btn-firebase-login-guest')?.addEventListener('click', async () => {
    try {
      await firebaseAuthService.signInAsGuest();
      showToast('Đã đăng nhập Ẩn danh! Dữ liệu của bạn được lưu tạm thời.', 'success');
    } catch (err) {
      showToast('Lỗi đăng nhập ẩn danh: ' + err.message, 'error');
    }
  });

  // Sign Out
  container.querySelector('#btn-firebase-signout')?.addEventListener('click', async () => {
    const ok = await confirmDialog('Bạn có chắc chắn muốn ngắt kết nối Cloud trên thiết bị này? Dữ liệu cục bộ vẫn sẽ được giữ lại.');
    if (ok) {
      await firebaseAuthService.signOut();
      showToast('Đã ngắt kết nối Cloud.', 'info');
    }
  });

  // Push All
  container.querySelector('#btn-firebase-push-all')?.addEventListener('click', async () => {
    const ok = await confirmDialog('Dữ liệu Cloud sẽ bị THAY THẾ hoàn toàn bằng dữ liệu trên thiết bị này, kể cả các khoản ghi từ thiết bị khác. Ứng dụng sẽ tải về file sao lưu dữ liệu Cloud hiện tại trước khi ghi đè. Bạn có chắc chắn không?', {
      title: 'Ghi đè dữ liệu Cloud',
      confirmText: 'Sao lưu & ghi đè',
      danger: true
    });
    if (!ok) return;
    try {
      // Never overwrite the cloud without a restorable copy of what is there now.
      const cloudData = await firebaseSyncService.pullAllData();
      ExportImportService.downloadJSON(cloudData, 'QuanLyChiTieu_CloudBackup');
      await firebaseSyncService.pushAllData(stateStore.getState());
      showToast('Đã tải toàn bộ dữ liệu lên Cloud thành công!', 'success');
    } catch (err) {
      showToast('Lỗi đẩy dữ liệu: ' + err.message, 'error');
    }
  });

  // Pull All
  container.querySelector('#btn-firebase-pull-all')?.addEventListener('click', async () => {
    const ok = await confirmDialog('Thao tác này sẽ tải dữ liệu từ Cloud về và GHI ĐÈ toàn bộ dữ liệu trên máy này. Bạn có chắc chắn không?', {
      title: 'Kéo dữ liệu từ Cloud',
      confirmText: 'Kéo về máy',
      danger: true
    });
    if (!ok) return;
    try {
      const cloudData = await firebaseSyncService.pullAllData();
      const cloudHasRecords = ['transactions', 'wallets', 'categories', 'debts'].some(k => cloudData[k]?.length > 0);
      if (cloudHasRecords) {
        stateStore.importAllData(cloudData);
        showToast(`Đã tải về ${cloudData.transactions.length} giao dịch từ Cloud thành công!`, 'success');
      } else {
        showToast('Chưa có dữ liệu nào trên Cloud.', 'info');
      }
    } catch (err) {
      showToast('Lỗi kéo dữ liệu: ' + err.message, 'error');
    }
  });

  // Custom Firebase Config events
  bindFirebaseConfigEvents(container);
}
