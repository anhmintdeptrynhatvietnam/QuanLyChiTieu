/**
 * Sync Status Badge Module
 * Monitors Firebase Cloud sync status and updates header badge.
 * Clicking/Enter opens Settings view via router navigation.
 */
import { stateStore } from '../state.js';
import { firebaseAuthService } from '../services/firebase-auth.js';
import { firebaseSyncService } from '../services/firebase-sync.js';
import { navigate } from './router.js';

export function setupSyncStatusSubscriber() {
  const badge = document.getElementById('sync-status-badge');
  if (badge) {
    const openSync = () => {
      navigate('settings');
    };
    badge.addEventListener('click', openSync);
    badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSync();
      }
    });
  }

  const updateBadge = () => {
    const badgeEl = document.getElementById('sync-status-badge');
    const textEl = document.getElementById('sync-status-text');
    if (!badgeEl || !textEl) return;

    const state = stateStore.getState();
    const fbUser = firebaseAuthService.getCurrentUser() || state.settings?.firebaseUser;
    const fbStatus = firebaseSyncService.getStatus();

    if (fbUser && fbStatus.status === 'connected') {
      badgeEl.className = 'badge badge-income';
      textEl.textContent = '⚡ Đã kết nối Cloud';
      badgeEl.title = 'Firebase Cloud: Đang kết nối và đồng bộ tức thì';
      const icon = badgeEl.querySelector('i');
      if (icon) icon.setAttribute('data-lucide', 'zap');
    } else if (fbUser && fbStatus.status === 'syncing') {
      badgeEl.className = 'badge badge-subtle';
      textEl.textContent = 'Đang đồng bộ...';
      badgeEl.title = 'Đang đồng bộ dữ liệu với Firebase Cloud';
      const icon = badgeEl.querySelector('i');
      if (icon) icon.setAttribute('data-lucide', 'refresh-cw');
    } else if (fbStatus.status === 'offline') {
      badgeEl.className = 'badge badge-subtle';
      textEl.textContent = 'Offline';
      badgeEl.title = fbStatus.message || 'Không có kết nối mạng';
      const icon = badgeEl.querySelector('i');
      if (icon) icon.setAttribute('data-lucide', 'wifi-off');
    } else if (fbStatus.status === 'error') {
      badgeEl.className = 'badge badge-expense';
      textEl.textContent = 'Lỗi kết nối';
      badgeEl.title = fbStatus.message || 'Lỗi kết nối Firebase';
      const icon = badgeEl.querySelector('i');
      if (icon) icon.setAttribute('data-lucide', 'alert-circle');
    } else {
      badgeEl.className = 'badge badge-subtle';
      textEl.textContent = 'Chưa kết nối Cloud';
      badgeEl.title = 'Bấm để vào Cài đặt và kết nối Cloud';
      const icon = badgeEl.querySelector('i');
      if (icon) icon.setAttribute('data-lucide', 'cloud-off');
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  stateStore.subscribe(updateBadge);
  firebaseSyncService.onStatusChange(updateBadge);
  updateBadge();
}
