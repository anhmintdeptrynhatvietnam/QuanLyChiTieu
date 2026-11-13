/**
 * Settings Section: Data Management (Export JSON/CSV, Import JSON, Reset Data)
 */
import { ExportImportService } from '../../services/export-import.js';
import { showToast } from '../../components/toast.js';
import { confirmDialog } from '../../components/confirm-dialog.js';

export function renderDataSection() {
  return `
    <!-- Backup & Restore Card -->
    <div class="card-v2 settings-data-card">
      <div class="settings-card-header">
        <div>
          <h3 class="settings-card-title">Sao Lưu & Quản Trị Dữ Liệu</h3>
          <small class="text-muted">Xuất file sao lưu dự phòng hoặc khôi phục dữ liệu</small>
        </div>
      </div>

      <div class="settings-data-actions">
        <button type="button" class="btn-v2 btn-v2-secondary" id="btn-export-json">
          <i data-lucide="download" style="width: 16px; height: 16px;"></i>
          <span>Xuất File JSON (.json)</span>
        </button>

        <button type="button" class="btn-v2 btn-v2-secondary" id="btn-export-csv">
          <i data-lucide="file-spreadsheet" style="width: 16px; height: 16px;"></i>
          <span>Xuất Bảng Excel (.csv)</span>
        </button>

        <label class="btn-v2 btn-v2-secondary settings-file-label">
          <i data-lucide="upload" style="width: 16px; height: 16px;"></i>
          <span>Khôi Phục File (.json)</span>
          <input type="file" id="input-import-json" accept=".json" style="display: none;">
        </label>
      </div>
    </div>

    <!-- Danger Zone Card -->
    <div class="card-v2 settings-danger-card">
      <div class="flex items-center gap-2" style="margin-bottom: var(--space-2);">
        <i data-lucide="alert-triangle" style="width: 18px; height: 18px; color: var(--expense-primary);"></i>
        <h3 class="settings-card-title" style="color: var(--expense-primary);">Khu Vực Nguy Hiểm</h3>
      </div>
      <p class="text-secondary" style="font-size: var(--font-size-sm); margin-bottom: var(--space-3); line-height: 1.5;">
        Xóa toàn bộ giao dịch, ví, hạng mục và cài đặt đã lưu trên trình duyệt này. Hành động này không thể hoàn tác — hãy sao lưu dữ liệu trước khi tiếp tục.
      </p>
      <div>
        <button type="button" class="btn-v2 btn-v2-danger" id="btn-reset-data">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          <span>Xóa Toàn Bộ Dữ Liệu</span>
        </button>
      </div>
    </div>
  `;
}

export function bindDataEvents(container) {
  // Export JSON
  container.querySelector('#btn-export-json')?.addEventListener('click', () => {
    try {
      ExportImportService.exportJSON();
      showToast('Đang tải về file sao lưu JSON...', 'info');
    } catch (err) {
      showToast('Lỗi xuất JSON: ' + err.message, 'error');
    }
  });

  // Export CSV
  container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
    try {
      ExportImportService.exportCSV();
      showToast('Đang tải về file bảng tính CSV...', 'info');
    } catch (err) {
      showToast('Lỗi xuất CSV: ' + err.message, 'error');
    }
  });

  // Import JSON
  const importInput = container.querySelector('#input-import-json');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        ExportImportService.importJSON(file, (res) => {
          if (res.success) {
            showToast('Khôi phục dữ liệu thành công!', 'success');
          } else {
            showToast('Lỗi khôi phục: ' + res.error, 'error');
          }
        });
      }
    });
  }

  // Reset Data with Typed Confirmation
  container.querySelector('#btn-reset-data')?.addEventListener('click', async () => {
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
