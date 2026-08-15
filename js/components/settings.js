import { stateStore } from '../state.js';
import { googleAuthService } from '../services/google-auth.js';
import { GoogleSheetsService } from '../services/google-sheets.js';
import { ExportImportService } from '../services/export-import.js';
import { SyncModal } from './sync-modal.js';
import { showToast } from './toast.js';
import { confirmDialog } from './confirm-dialog.js';
import { escapeHtml } from '../utils/helpers.js';
import { CATEGORY_PALETTE } from '../config.js';

export class Settings {
  constructor(containerId = 'view-settings') {
    this.container = document.getElementById(containerId);
    this.syncModal = new SyncModal();
    window.syncModal = this.syncModal;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    stateStore.subscribe(() => this.render());
  }

  render() {
    const state = stateStore.getState();
    const isConnected = googleAuthService.getValidToken() !== null;
    const syncStatus = state.syncStatus;
    const hasBackup = GoogleSheetsService.hasPrePullBackup();
    const backupInfo = hasBackup ? GoogleSheetsService.getPrePullBackupInfo() : null;

    this.container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Undo Banner (if user pulled recently) -->
        ${hasBackup && backupInfo ? `
          <div class="card" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-left: 4px solid #f59e0b; padding: var(--space-3);">
            <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 8px;">
              <div class="flex items-center gap-2">
                <i data-lucide="info" style="width: 18px; height: 18px; color: #f59e0b; flex-shrink: 0;"></i>
                <div>
                  <strong style="color: #d97706; font-size: var(--font-size-sm);">Bản sao lưu trước khi kéo từ Cloud</strong>
                  <div class="text-muted" style="font-size: 11px;">
                    Lưu lúc ${new Date(backupInfo.savedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} (${backupInfo.txCount || 0} giao dịch, ${backupInfo.walletCount || 0} ví)
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <button type="button" class="btn btn-primary" id="btn-undo-pull" style="padding: 5px 10px; font-size: var(--font-size-xs); background: #d97706; border-color: #d97706;">
                  <i data-lucide="undo" style="width: 14px; height: 14px;"></i>
                  <span>Hoàn Tác Lại</span>
                </button>
                <button type="button" class="btn btn-secondary" id="btn-dismiss-undo" style="padding: 5px 8px; font-size: var(--font-size-xs);">
                  Bỏ qua
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Google Sheets Cloud Sync Card -->
        <div class="card">
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
            <div class="flex items-center gap-2">
              <div class="badge ${isConnected ? 'badge-income' : 'badge-subtle'}">
                <i data-lucide="${isConnected ? 'cloud' : 'cloud-off'}" style="width: 14px; height: 14px;"></i>
                <span>${isConnected ? 'Google Cloud Đã Kết Nối' : 'Chưa Kết Nối'}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Google OAuth Client ID</label>
              <div class="flex gap-2">
                <input type="text" id="setting-client-id" class="form-input" placeholder="xxxx.apps.googleusercontent.com" value="${escapeHtml(state.settings.googleClientId || '')}">
                <button type="button" class="btn btn-primary" id="btn-save-client-id">Lưu</button>
              </div>
              <small class="text-muted">Client ID dùng để xác thực an toàn trực tiếp với Google Sheets của bạn.</small>
            </div>

            <details class="card" style="background: var(--bg-subtle); padding: var(--space-3); margin: 0;">
              <summary style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: var(--font-size-sm); font-weight: 600; color: var(--primary-600); list-style: none;">
                <i data-lucide="book-open" style="width: 16px; height: 16px;"></i>
                <span>Hướng dẫn lấy Google Client ID</span>
              </summary>
              <ol style="margin: var(--space-3) 0 0; padding-left: var(--space-5); font-size: var(--font-size-sm); color: var(--text-secondary); display: flex; flex-direction: column; gap: 6px;">
                <li>Truy cập console.cloud.google.com và tạo 1 Project mới.</li>
                <li>Vào mục "APIs & Services" &gt; "Enabled APIs" &gt; Bật "Google Sheets API" và "Google Drive API".</li>
                <li>Vào "OAuth consent screen" &gt; Chọn "External" &gt; Điền tên ứng dụng "QuanLyChiTieu".</li>
                <li>Vào "Credentials" &gt; Bấm "Create Credentials" &gt; Chọn "OAuth Client ID" &gt; Loại "Web application".</li>
                <li>Thêm địa chỉ web của bạn vào "Authorized JavaScript origins" (ví dụ: http://localhost:5500 hoặc https://username.github.io).</li>
                <li>Copy Client ID dán vào ô cài đặt trên web này và bấm Lưu!</li>
              </ol>
            </details>

            <div class="flex gap-2" style="flex-wrap: wrap; margin-top: var(--space-2);">
              ${!isConnected ? `
                <button type="button" class="btn btn-primary" id="btn-connect-google">
                  <i data-lucide="log-in" style="width: 16px; height: 16px;"></i>
                  <span>Kết Nối Tài Khoản Google</span>
                </button>
              ` : `
                <button type="button" class="btn btn-primary" id="btn-open-sync-modal">
                  <i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i>
                  <span>Đồng Bộ (2 Lựa Chọn)</span>
                </button>
                <button type="button" class="btn btn-secondary" id="btn-quick-push" title="Đẩy dữ liệu lên Cloud">
                  <i data-lucide="arrow-up-circle" style="width: 16px; height: 16px; color: var(--primary-600);"></i>
                  <span>Đẩy Lên</span>
                </button>
                <button type="button" class="btn btn-secondary" id="btn-quick-pull" title="Kéo dữ liệu về Máy">
                  <i data-lucide="arrow-down-circle" style="width: 16px; height: 16px; color: #10b981;"></i>
                  <span>Kéo Về</span>
                </button>
                <button type="button" class="btn btn-secondary" id="btn-disconnect-google">
                  <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
                  <span>Đăng Xuất</span>
                </button>
              `}
            </div>

            <div class="text-muted" style="font-size: var(--font-size-xs); margin-top: var(--space-2);">
              Trạng thái: <strong>${escapeHtml(syncStatus.message)}</strong>
            </div>
          </div>
        </div>

        <!-- Category Management Card -->
        <div class="card">
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
            <div>
              <h3 style="font-size: var(--font-size-base); font-weight: 600;">Quản Lý Hạng Mục (Chi Tiêu & Thu Nhập)</h3>
              <small class="text-muted">Tùy chỉnh danh mục theo nhu cầu chi tiêu cá nhân của bạn</small>
            </div>
          </div>

          <!-- Add Category Form -->
          <div class="flex gap-2" style="flex-wrap: wrap; margin-bottom: var(--space-4); background: var(--bg-subtle); padding: var(--space-3); border-radius: var(--radius-md);">
            <input type="text" id="new-cat-name" class="form-input" placeholder="Tên loại mới (Ví dụ: Thể thao, Nuôi thú cưng...)" style="flex: 2; min-width: 180px;">
            <select id="new-cat-type" class="form-select" style="flex: 1; min-width: 120px;">
              <option value="expense">Chi tiêu</option>
              <option value="income">Thu nhập</option>
            </select>
            <button type="button" class="btn btn-primary" id="btn-add-category">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
              <span>Thêm Hạng Mục</span>
            </button>
          </div>

          <!-- Categories List -->
          <div class="flex flex-col gap-4">
            <div>
              <span class="font-semibold text-secondary flex items-center gap-2" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
                <i data-lucide="trending-down" style="width: 14px; height: 14px; color: var(--expense-primary);"></i>
                Hạng mục Chi Tiêu (${state.categories.filter(c => c.type === 'expense').length})
              </span>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${state.categories.filter(c => c.type === 'expense').map(c => `
                  <div class="badge badge-subtle flex items-center gap-2" style="padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-subtle);">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${c.color || '#f97316'}; display: inline-block;"></span>
                    <span>${escapeHtml(c.name)}</span>
                    <button type="button" class="btn-delete-cat text-muted" data-id="${c.id}" title="Xóa hạng mục" style="background: none; border: none; cursor: pointer; padding: 0; margin-left: 4px; display: flex; align-items: center; color: var(--expense-primary);">
                      <i data-lucide="x" style="width: 12px; height: 12px;"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>

            <div>
              <span class="font-semibold text-secondary flex items-center gap-2" style="font-size: var(--font-size-sm); margin-bottom: var(--space-2);">
                <i data-lucide="trending-up" style="width: 14px; height: 14px; color: var(--income-primary);"></i>
                Hạng mục Thu Nhập (${state.categories.filter(c => c.type === 'income').length})
              </span>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${state.categories.filter(c => c.type === 'income').map(c => `
                  <div class="badge badge-subtle flex items-center gap-2" style="padding: 6px 10px; font-size: 13px; border: 1px solid var(--border-subtle);">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${c.color || '#10b981'}; display: inline-block;"></span>
                    <span>${escapeHtml(c.name)}</span>
                    <button type="button" class="btn-delete-cat text-muted" data-id="${c.id}" title="Xóa hạng mục" style="background: none; border: none; cursor: pointer; padding: 0; margin-left: 4px; display: flex; align-items: center; color: var(--expense-primary);">
                      <i data-lucide="x" style="width: 12px; height: 12px;"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile App / PWA Install Guide Card -->
        <div class="card" style="border-left: 4px solid var(--primary-500);">
          <div class="flex items-center gap-3" style="margin-bottom: var(--space-3);">
            <div class="badge badge-subtle"><i data-lucide="smartphone" style="width: 18px; height: 18px;"></i></div>
            <div>
              <h3 style="font-size: var(--font-size-base); font-weight: 600;">Cài Đặt Ứng Dụng Trên Điện Thoại (PWA)</h3>
              <small class="text-muted">Thêm app vào Màn hình chính để dùng toàn màn hình, mượt mà như app tải từ App Store</small>
            </div>
          </div>

          <details class="card" style="background: var(--bg-subtle); padding: var(--space-3); margin: 0;">
            <summary style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: var(--font-size-sm); font-weight: 600; color: var(--primary-600); list-style: none;">
              <i data-lucide="smartphone" style="width: 16px; height: 16px;"></i>
              <span>Xem Hướng Dẫn Cài Đặt</span>
            </summary>
            <div style="margin-top: var(--space-3); font-size: var(--font-size-sm); color: var(--text-secondary); display: flex; flex-direction: column; gap: var(--space-3);">
              <div>
                <strong>🍏 Dành cho iPhone / iPad (Trình duyệt Safari):</strong>
                <ol style="margin: var(--space-2) 0 0; padding-left: var(--space-5); display: flex; flex-direction: column; gap: 4px;">
                  <li>Mở link web ứng dụng bằng Safari.</li>
                  <li>Bấm vào nút "Chia sẻ" (Biểu tượng ô vuông có mũi tên trỏ lên ở thanh dưới cùng).</li>
                  <li>Cuộn xuống và chọn "Thêm vào Màn hình chính" (Add to Home Screen).</li>
                  <li>Bấm "Thêm" ở góc trên bên phải. Xong! Ứng dụng sẽ xuất hiện như 1 App độc lập không có thanh địa chỉ web.</li>
                </ol>
              </div>
              <div>
                <strong>🤖 Dành cho Android (Trình duyệt Chrome / Brave):</strong>
                <ol style="margin: var(--space-2) 0 0; padding-left: var(--space-5); display: flex; flex-direction: column; gap: 4px;">
                  <li>Mở link web bằng Chrome.</li>
                  <li>Bấm vào dấu 3 chấm (⋮) ở góc trên bên phải.</li>
                  <li>Chọn "Cài đặt ứng dụng" hoặc "Thêm vào Màn hình chính".</li>
                  <li>Bấm xác nhận Cài đặt!</li>
                </ol>
              </div>
            </div>
          </details>
        </div>

        <!-- Data Management Card (Backup / Restore) -->
        <div class="card">
          <h3 style="font-size: var(--font-size-base); margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
            Sao Lưu & Quản Trị Dữ Liệu
          </h3>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3);">
            <button type="button" class="btn btn-secondary" id="btn-export-json">
              <i data-lucide="download" style="width: 16px; height: 16px;"></i>
              <span>Xuất File Sao Lưu (.JSON)</span>
            </button>

            <button type="button" class="btn btn-secondary" id="btn-export-csv">
              <i data-lucide="file-spreadsheet" style="width: 16px; height: 16px;"></i>
              <span>Xuất Bảng Tính Excel (.CSV)</span>
            </button>

            <label class="btn btn-secondary" style="cursor: pointer;">
              <i data-lucide="upload" style="width: 16px; height: 16px;"></i>
              <span>Khôi Phục File (.JSON)</span>
              <input type="file" id="input-import-json" accept=".json" style="display: none;">
            </label>
          </div>
        </div>

        <!-- Danger Zone: Reset Data -->
        <div class="danger-zone">
          <div class="flex items-center gap-2" style="margin-bottom: var(--space-2);">
            <i data-lucide="alert-triangle" style="width: 18px; height: 18px; color: var(--expense-primary);"></i>
            <h3 style="font-size: var(--font-size-base); font-weight: 600; color: var(--expense-primary);">Khu Vực Nguy Hiểm</h3>
          </div>
          <p class="text-muted" style="font-size: var(--font-size-sm); margin-bottom: var(--space-3);">
            Xóa toàn bộ giao dịch, ví, hạng mục và cài đặt đã lưu trên trình duyệt này. Hành động này không thể hoàn tác — hãy sao lưu dữ liệu trước khi tiếp tục.
          </p>
          <button type="button" class="btn btn-danger" id="btn-reset-data">
            <i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i>
            <span>Xóa Sạch Dữ Liệu (Reset)</span>
          </button>
        </div>
      </div>
    `;

    this.bindCardEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  bindEvents() {}

  bindCardEvents() {
    // Add Category
    const addCatBtn = this.container.querySelector('#btn-add-category');
    if (addCatBtn) {
      addCatBtn.addEventListener('click', () => {
        const nameInput = this.container.querySelector('#new-cat-name');
        const typeSelect = this.container.querySelector('#new-cat-type');
        const name = nameInput.value.trim();
        const type = typeSelect.value;

        if (!name) {
          showToast('Vui lòng nhập tên hạng mục', 'error');
          return;
        }

        const randomColor = CATEGORY_PALETTE[Math.floor(Math.random() * CATEGORY_PALETTE.length)];

        stateStore.addCategory({ name, type, color: randomColor });
        nameInput.value = '';
      });
    }

    // Delete Category
    this.container.querySelectorAll('.btn-delete-cat').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const ok = await confirmDialog('Bạn có chắc chắn muốn xóa hạng mục này?', { danger: true });
        if (ok) {
          const res = stateStore.deleteCategory(id);
          if (!res.success) showToast(res.reason, 'error');
        }
      });
    });

    // Save Client ID
    const saveBtn = this.container.querySelector('#btn-save-client-id');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const clientId = this.container.querySelector('#setting-client-id').value.trim();
        stateStore.updateSettings({ googleClientId: clientId });
        showToast('Đã lưu Google Client ID thành công!', 'success');
      });
    }

    // Undo Pull
    const undoBtn = this.container.querySelector('#btn-undo-pull');
    if (undoBtn) {
      undoBtn.addEventListener('click', async () => {
        const ok = await confirmDialog('Bạn có chắc chắn muốn hoàn tác lại dữ liệu trước lần kéo gần nhất từ Google Sheets?', { danger: true });
        if (!ok) return;
        try {
          GoogleSheetsService.restorePrePullBackup();
          showToast('Đã hoàn tác lại dữ liệu thành công!', 'success');
          this.render();
        } catch (err) {
          showToast('Lỗi hoàn tác: ' + err.message, 'error');
        }
      });
    }

    // Dismiss Undo Banner
    const dismissUndoBtn = this.container.querySelector('#btn-dismiss-undo');
    if (dismissUndoBtn) {
      dismissUndoBtn.addEventListener('click', () => {
        GoogleSheetsService.clearPrePullBackup();
        this.render();
      });
    }

    // Connect Google
    const connectBtn = this.container.querySelector('#btn-connect-google');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        const clientId = stateStore.getState().settings.googleClientId;
        if (!clientId) {
          showToast('Vui lòng nhập Google Client ID trước khi kết nối.', 'error');
          return;
        }
        googleAuthService.init(clientId, async (token) => {
          this.syncModal.open();
        });
        googleAuthService.signIn();
      });
    }

    // Disconnect Google
    const disconnectBtn = this.container.querySelector('#btn-disconnect-google');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        googleAuthService.signOut();
        showToast('Đã đăng xuất Google.', 'info');
      });
    }

    // Open Sync Modal (2 Choices)
    const openSyncBtn = this.container.querySelector('#btn-open-sync-modal');
    if (openSyncBtn) {
      openSyncBtn.addEventListener('click', () => {
        this.syncModal.open();
      });
    }

    // Quick Push
    const quickPushBtn = this.container.querySelector('#btn-quick-push');
    if (quickPushBtn) {
      quickPushBtn.addEventListener('click', async () => {
        const token = googleAuthService.getValidToken();
        if (!token) {
          googleAuthService.signIn();
          return;
        }
        try {
          const res = await GoogleSheetsService.push(token);
          showToast(`Đã đẩy ${res.count} giao dịch lên Google Sheets!`, 'success');
        } catch (e) {
          showToast('Lỗi đẩy dữ liệu: ' + e.message, 'error');
        }
      });
    }

    // Quick Pull
    const quickPullBtn = this.container.querySelector('#btn-quick-pull');
    if (quickPullBtn) {
      quickPullBtn.addEventListener('click', async () => {
        const ok = await confirmDialog('Thao tác này sẽ tải dữ liệu từ Google Sheets về và GHI ĐÈ dữ liệu trên máy. Bạn có chắc chắn không?', { danger: true });
        if (!ok) return;
        const token = googleAuthService.getValidToken();
        if (!token) {
          googleAuthService.signIn();
          return;
        }
        try {
          const res = await GoogleSheetsService.pull(token);
          showToast(`Đã tải về ${res.txCount} giao dịch từ Google Sheets!`, 'success');
        } catch (e) {
          showToast('Lỗi kéo dữ liệu: ' + e.message, 'error');
        }
      });
    }

    // Export JSON / CSV
    this.container.querySelector('#btn-export-json')?.addEventListener('click', () => ExportImportService.exportJSON());
    this.container.querySelector('#btn-export-csv')?.addEventListener('click', () => ExportImportService.exportCSV());

    // Import JSON
    const importInput = this.container.querySelector('#input-import-json');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          ExportImportService.importJSON(file, (res) => {
            if (res.success) showToast('Khôi phục dữ liệu thành công!', 'success');
            else showToast('Lỗi khôi phục: ' + res.error, 'error');
          });
        }
      });
    }

    // Reset Data
    this.container.querySelector('#btn-reset-data')?.addEventListener('click', async () => {
      const ok = await confirmDialog('Thao tác này sẽ xoá vĩnh viễn toàn bộ dữ liệu cục bộ. Gõ "XÓA" để xác nhận.', {
        title: 'Xoá toàn bộ dữ liệu',
        danger: true,
        requireText: 'XÓA',
        confirmText: 'Xoá vĩnh viễn'
      });
      if (ok) {
        localStorage.clear();
        location.reload();
      }
    });
  }
}
