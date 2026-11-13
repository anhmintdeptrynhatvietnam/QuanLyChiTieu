/**
 * Settings Section: Custom Firebase Config Form
 */
import { stateStore } from '../../state.js';
import { showToast } from '../../components/toast.js';
import { escapeHtml } from '../../utils/helpers.js';
import { DEFAULT_FIREBASE_CONFIG } from '../../config.js';

export function renderFirebaseConfigForm(fbConfig = DEFAULT_FIREBASE_CONFIG) {
  return `
    <details class="settings-details">
      <summary class="settings-details-summary">
        <i data-lucide="settings-2" style="width: 16px; height: 16px;"></i>
        <span>Cấu Hình Firebase Riêng (Tùy chọn)</span>
      </summary>
      <div class="settings-details-body">
        <p class="text-muted" style="font-size: 11px; margin: 0;">
          Mặc định ứng dụng đã có sẵn cấu hình Firebase. Nếu muốn dùng Firebase riêng của bạn, hãy dán thông số vào đây:
        </p>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 11px;">Firebase Project ID</label>
          <input type="text" id="setting-fb-projectid" class="form-input" value="${escapeHtml(fbConfig.projectId || '')}" placeholder="sothuchi-xxxxx">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 11px;">Firebase API Key</label>
          <input type="text" id="setting-fb-apikey" class="form-input" value="${escapeHtml(fbConfig.apiKey || '')}" placeholder="AIzaSy...">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 11px;">Firebase Auth Domain</label>
          <input type="text" id="setting-fb-authdomain" class="form-input" value="${escapeHtml(fbConfig.authDomain || '')}" placeholder="sothuchi-xxxxx.firebaseapp.com">
        </div>
        <div class="flex justify-end">
          <button type="button" class="btn-v2 btn-v2-primary" id="btn-save-fb-config" style="padding: 6px 14px; font-size: var(--font-size-xs);">
            <span>Lưu Cấu Hình</span>
          </button>
        </div>
      </div>
    </details>
  `;
}

export function bindFirebaseConfigEvents(container) {
  container.querySelector('#btn-save-fb-config')?.addEventListener('click', () => {
    const projectId = container.querySelector('#setting-fb-projectid')?.value.trim();
    const apiKey = container.querySelector('#setting-fb-apikey')?.value.trim();
    const authDomain = container.querySelector('#setting-fb-authdomain')?.value.trim();

    if (!projectId || !apiKey) {
      showToast('Vui lòng nhập đầy đủ Project ID và API Key.', 'error');
      return;
    }

    const newConfig = {
      ...DEFAULT_FIREBASE_CONFIG,
      projectId,
      apiKey,
      authDomain: authDomain || `${projectId}.firebaseapp.com`,
      storageBucket: `${projectId}.firebasestorage.app`
    };

    stateStore.updateSettings({ firebaseConfig: newConfig });
    showToast('Đã lưu cấu hình Firebase mới! Vui lòng làm mới trang để kích hoạt.', 'success');
  });
}
