/**
 * Google Sheets Sync Selection Modal (Push / Pull & Safe Snapshot)
 */
import { stateStore } from '../state.js';
import { googleAuthService } from '../services/google-auth.js';
import { GoogleSheetsService } from '../services/google-sheets.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/helpers.js';

export class SyncModal {
  constructor() {
    this.modalEl = null;
    this.isSyncing = false;
    this.init();
  }

  init() {
    this.createModalDOM();
    this.bindEvents();
  }

  createModalDOM() {
    const existing = document.getElementById('sync-choice-modal');
    if (existing) existing.remove();

    const modalHTML = `
      <div id="sync-choice-modal" class="modal-overlay" style="display: none; align-items: center; justify-content: center; z-index: 1050;">
        <div class="modal-content" style="max-width: 520px; width: 92%; max-height: 90vh; overflow-y: auto;">
          <!-- Header -->
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
            <div class="flex items-center gap-2">
              <div class="badge badge-primary" style="padding: 6px 10px;">
                <i data-lucide="cloud" style="width: 16px; height: 16px;"></i>
                <span style="font-weight: 600;">Đồng Bộ Google Sheets</span>
              </div>
            </div>
            <button type="button" class="btn btn-icon" id="btn-close-sync-modal" style="background: none; border: none; cursor: pointer; color: var(--text-muted);">
              <i data-lucide="x" style="width: 18px; height: 18px;"></i>
            </button>
          </div>

          <p class="text-secondary" style="font-size: var(--font-size-sm); margin-bottom: var(--space-4); line-height: 1.5;">
            Chọn hướng đồng bộ dữ liệu giữa thiết bị hiện tại và bảng tính Google Sheets của bạn:
          </p>

          <!-- Action Options Cards -->
          <div class="flex flex-col gap-3" style="margin-bottom: var(--space-4);">
            <!-- Option 1: Push (Local -> Cloud) -->
            <div class="card sync-option-card" style="border: 2px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-3); transition: all 0.2s ease; background: var(--bg-card);">
              <div class="flex items-start gap-3">
                <div style="background: rgba(37, 99, 235, 0.12); color: var(--primary-600); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <i data-lucide="cloud-upload" style="width: 22px; height: 22px;"></i>
                </div>
                <div style="flex: 1;">
                  <div class="flex items-center justify-between">
                    <h4 style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary);">
                      1. Đẩy lên Google Sheets (Push)
                    </h4>
                    <span class="badge badge-subtle" style="font-size: 11px;">Ghi đè Cloud</span>
                  </div>
                  <p class="text-muted" style="font-size: var(--font-size-xs); margin: 4px 0 8px 0; line-height: 1.4;">
                    Lưu toàn bộ dữ liệu từ thiết bị này lên file Google Sheets trên Google Drive.
                  </p>
                  <div id="sync-local-stats" class="flex gap-2" style="flex-wrap: wrap; margin-bottom: var(--space-2); font-size: 11px; color: var(--text-secondary);">
                    <!-- Dynamic stats -->
                  </div>
                  <button type="button" class="btn btn-primary w-full" id="btn-action-push" style="padding: 8px 14px; font-weight: 600;">
                    <i data-lucide="arrow-up-circle" style="width: 16px; height: 16px;"></i>
                    <span>Bắt Đầu Đẩy Lên Cloud</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Option 2: Pull (Cloud -> Local) -->
            <div class="card sync-option-card" style="border: 2px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-3); transition: all 0.2s ease; background: var(--bg-card);">
              <div class="flex items-start gap-3">
                <div style="background: rgba(16, 185, 129, 0.12); color: #10b981; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <i data-lucide="cloud-download" style="width: 22px; height: 22px;"></i>
                </div>
                <div style="flex: 1;">
                  <div class="flex items-center justify-between">
                    <h4 style="font-size: var(--font-size-base); font-weight: 700; color: var(--text-primary);">
                      2. Kéo về từ Google Sheets (Pull)
                    </h4>
                    <span class="badge badge-warning" style="font-size: 11px; background: rgba(245, 158, 11, 0.12); color: #d97706;">Ghi đè Máy</span>
                  </div>
                  <p class="text-muted" style="font-size: var(--font-size-xs); margin: 4px 0 8px 0; line-height: 1.4;">
                    Tải toàn bộ dữ liệu từ Google Sheets về thay thế dữ liệu trên máy này.
                  </p>
                  <div class="badge badge-subtle" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; margin-bottom: var(--space-2); background: var(--bg-subtle);">
                    <i data-lucide="shield-check" style="width: 13px; height: 13px; color: #10b981;"></i>
                    <span>Tự động lưu bản sao lưu dự phòng trước khi nạp</span>
                  </div>
                  <button type="button" class="btn btn-secondary w-full" id="btn-action-pull" style="padding: 8px 14px; font-weight: 600; border-color: var(--border-subtle);">
                    <i data-lucide="arrow-down-circle" style="width: 16px; height: 16px; color: #10b981;"></i>
                    <span>Bắt Đầu Kéo Về Máy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading / Status indicator -->
          <div id="sync-modal-status" class="hidden" style="margin-bottom: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--font-size-xs); text-align: center;">
            <div class="flex items-center justify-center gap-2">
              <div class="spinner" style="width: 14px; height: 14px; border: 2px solid var(--primary-500); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
              <span id="sync-modal-status-text">Đang kết nối Google...</span>
            </div>
          </div>

          <!-- Footer info -->
          <div class="flex items-center justify-between text-muted" style="font-size: 11px; border-top: 1px solid var(--border-subtle); padding-top: var(--space-2);">
            <span id="sync-modal-file-info">File: QuanLyChiTieu_DB</span>
            <span id="sync-modal-last-sync">Lần cuối: Chưa đồng bộ</span>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalEl = document.getElementById('sync-choice-modal');
  }

  bindEvents() {
    if (!this.modalEl) return;

    // Close button & overlay click
    this.modalEl.querySelector('#btn-close-sync-modal')?.addEventListener('click', () => this.close());
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl && !this.isSyncing) this.close();
    });

    // Push button
    this.modalEl.querySelector('#btn-action-push')?.addEventListener('click', () => this.handlePush());

    // Pull button
    this.modalEl.querySelector('#btn-action-pull')?.addEventListener('click', () => this.handlePull());
  }

  updateStats() {
    const state = stateStore.getState();
    const statsEl = this.modalEl.querySelector('#sync-local-stats');
    if (statsEl) {
      const txCount = state.transactions?.length || 0;
      const walletCount = state.wallets?.length || 0;
      const catCount = state.categories?.length || 0;
      const debtCount = state.debts?.length || 0;
      statsEl.innerHTML = `
        <span class="badge badge-subtle">📊 <strong>${txCount}</strong> giao dịch</span>
        <span class="badge badge-subtle">💳 <strong>${walletCount}</strong> ví</span>
        <span class="badge badge-subtle">🏷️ <strong>${catCount}</strong> danh mục</span>
        ${debtCount > 0 ? `<span class="badge badge-subtle">🤝 <strong>${debtCount}</strong> khoản nợ</span>` : ''}
      `;
    }

    const lastSyncEl = this.modalEl.querySelector('#sync-modal-last-sync');
    if (lastSyncEl) {
      const lastTime = state.settings.lastSyncTime;
      if (lastTime) {
        const timeStr = new Date(lastTime).toLocaleString('vi-VN', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        lastSyncEl.textContent = `Lần cuối: ${timeStr}`;
      } else {
        lastSyncEl.textContent = 'Lần cuối: Chưa đồng bộ';
      }
    }
  }

  showStatus(msg, isError = false) {
    const statusEl = this.modalEl.querySelector('#sync-modal-status');
    const textEl = this.modalEl.querySelector('#sync-modal-status-text');
    if (statusEl && textEl) {
      statusEl.classList.remove('hidden');
      statusEl.style.background = isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)';
      statusEl.style.color = isError ? 'var(--expense-primary)' : 'var(--primary-600)';
      textEl.textContent = msg;
    }
  }

  hideStatus() {
    const statusEl = this.modalEl.querySelector('#sync-modal-status');
    if (statusEl) statusEl.classList.add('hidden');
  }

  setLoading(loading) {
    this.isSyncing = loading;
    const pushBtn = this.modalEl.querySelector('#btn-action-push');
    const pullBtn = this.modalEl.querySelector('#btn-action-pull');
    const closeBtn = this.modalEl.querySelector('#btn-close-sync-modal');

    if (pushBtn) pushBtn.disabled = loading;
    if (pullBtn) pullBtn.disabled = loading;
    if (closeBtn) closeBtn.disabled = loading;
  }

  async ensureGoogleAuth() {
    const clientId = stateStore.getState().settings.googleClientId;
    if (!clientId) {
      alert('Vui lòng nhập Google Client ID trong phần "Cài đặt & Đồng bộ" trước khi thực hiện!');
      return null;
    }

    let token = googleAuthService.getValidToken();
    if (!token) {
      this.showStatus('Đang mở cửa sổ đăng nhập Google...');
      return new Promise((resolve) => {
        googleAuthService.init(clientId, (newToken) => {
          resolve(newToken);
        });
        googleAuthService.signIn();
      });
    }
    return token;
  }

  async handlePush() {
    try {
      this.setLoading(true);
      this.showStatus('Đang kiểm tra kết nối Google...');
      const token = await this.ensureGoogleAuth();
      if (!token) {
        this.hideStatus();
        this.setLoading(false);
        return;
      }

      this.showStatus('Đang đẩy toàn bộ dữ liệu lên Google Sheets...');
      const res = await GoogleSheetsService.push(token);

      this.showStatus('✅ Đẩy dữ liệu lên Google Sheets thành công!');
      if (window.showToast) {
        showToast(`Đã sao lưu ${res.count} giao dịch lên Google Sheets thành công!`, 'success');
      } else {
        alert(`Đã sao lưu ${res.count} giao dịch lên Google Sheets thành công!`);
      }
      this.updateStats();
      setTimeout(() => {
        this.close();
      }, 1200);
    } catch (err) {
      console.error(err);
      this.showStatus('❌ Lỗi: ' + err.message, true);
      alert('Lỗi đẩy dữ liệu: ' + err.message);
    } finally {
      this.setLoading(false);
    }
  }

  async handlePull() {
    const confirmMsg = 
      '⚠️ CẢNH BÁO GHI ĐÈ DỮ LIỆU:\n\n' +
      'Thao tác này sẽ tải dữ liệu từ Google Sheets về và GHI ĐÈ TOÀN BỘ dữ liệu trên thiết bị này.\n\n' +
      'Hệ thống sẽ tự động lưu một bản sao lưu an toàn trước khi nạp để bạn có thể hoàn tác nếu cần.\n\n' +
      'Bạn có chắc chắn muốn tiếp tục kéo dữ liệu về không?';

    if (!confirm(confirmMsg)) return;

    try {
      this.setLoading(true);
      this.showStatus('Đang kiểm tra kết nối Google...');
      const token = await this.ensureGoogleAuth();
      if (!token) {
        this.hideStatus();
        this.setLoading(false);
        return;
      }

      this.showStatus('Đang tải dữ liệu từ Google Sheets về...');
      const res = await GoogleSheetsService.pull(token);

      this.showStatus('✅ Đã tải về và tính toán lại số dư thành công!');
      if (window.showToast) {
        showToast(`Đã tải về thành công ${res.txCount} giao dịch từ Google Sheets!`, 'success');
      } else {
        alert(`Đã tải về thành công ${res.txCount} giao dịch từ Google Sheets!`);
      }
      this.updateStats();
      setTimeout(() => {
        this.close();
      }, 1200);
    } catch (err) {
      console.error(err);
      this.showStatus('❌ Lỗi: ' + err.message, true);
      alert('Lỗi kéo dữ liệu: ' + err.message);
    } finally {
      this.setLoading(false);
    }
  }

  open() {
    if (!this.modalEl) this.createModalDOM();
    this.updateStats();
    this.hideStatus();
    this.modalEl.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }

  close() {
    if (this.modalEl) this.modalEl.style.display = 'none';
  }
}
