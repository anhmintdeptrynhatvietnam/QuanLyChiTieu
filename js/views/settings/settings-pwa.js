/**
 * Settings Section: Mobile App (PWA) Install Guide
 */

export function renderPwaSection() {
  return `
    <div class="card-v2 settings-pwa-card">
      <div class="flex items-center gap-3" style="margin-bottom: var(--space-3);">
        <div class="settings-pwa-badge">
          <i data-lucide="smartphone" style="width: 20px; height: 20px; color: var(--primary-500);"></i>
        </div>
        <div>
          <h3 class="settings-card-title">Cài Đặt Ứng Dụng Điện Thoại (PWA)</h3>
          <small class="text-muted">Thêm app vào Màn hình chính để dùng toàn màn hình, mượt mà như app gốc</small>
        </div>
      </div>

      <details class="settings-details">
        <summary class="settings-details-summary">
          <i data-lucide="help-circle" style="width: 16px; height: 16px;"></i>
          <span>Xem Hướng Dẫn Cài Đặt (iOS & Android)</span>
        </summary>
        <div class="settings-details-body">
          <div class="settings-pwa-step">
            <strong>🍏 Dành cho iPhone / iPad (Trình duyệt Safari):</strong>
            <ol class="settings-pwa-list">
              <li>Mở link web ứng dụng bằng trình duyệt Safari.</li>
              <li>Bấm nút <strong>Chia sẻ</strong> (biểu tượng ô vuông có mũi tên hướng lên).</li>
              <li>Cuộn xuống và chọn <strong>Thêm vào Màn hình chính</strong> (Add to Home Screen).</li>
              <li>Bấm <strong>Thêm</strong> ở góc trên bên phải. Ứng dụng sẽ xuất hiện như 1 app độc lập.</li>
            </ol>
          </div>
          <div class="settings-pwa-step">
            <strong>🤖 Dành cho Android (Chrome / Brave / Edge):</strong>
            <ol class="settings-pwa-list">
              <li>Mở link web bằng Google Chrome hoặc Brave.</li>
              <li>Bấm vào dấu <strong>3 chấm (⋮)</strong> ở góc trên bên phải.</li>
              <li>Chọn <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào Màn hình chính</strong>.</li>
              <li>Bấm xác nhận Cài đặt để hoàn tất.</li>
            </ol>
          </div>
        </div>
      </details>
    </div>
  `;
}
