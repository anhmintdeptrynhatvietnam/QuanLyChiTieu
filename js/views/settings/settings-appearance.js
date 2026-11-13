/**
 * Settings Section: Appearance & Theme (3-way Segmented)
 */
import { getThemePreference, setThemePreference } from '../../ui/theme.js';
import { showToast } from '../../components/toast.js';
import { isAmountVisible, setAmountVisible } from '../../utils/privacy.js';

export function renderAppearanceSection() {
  const currentPref = getThemePreference();
  const isBalanceVisible = isAmountVisible('dashboard_balance', true);

  return `
    <div class="card-v2 settings-appearance-card">
      <div class="settings-card-header">
        <div>
          <h3 class="settings-card-title">Giao Diện & Chủ Đề</h3>
          <small class="text-muted">Tùy biến hiển thị sáng, tối hoặc tự động theo thiết bị</small>
        </div>
      </div>

      <div class="segmented settings-theme-segmented">
        <button type="button" class="segmented-item ${currentPref === 'light' ? 'active' : ''}" data-theme-choice="light">
          <i data-lucide="sun" style="width: 15px; height: 15px;"></i>
          <span>Sáng</span>
        </button>
        <button type="button" class="segmented-item ${currentPref === 'dark' ? 'active' : ''}" data-theme-choice="dark">
          <i data-lucide="moon" style="width: 15px; height: 15px;"></i>
          <span>Tối</span>
        </button>
        <button type="button" class="segmented-item ${currentPref === 'system' ? 'active' : ''}" data-theme-choice="system">
          <i data-lucide="laptop" style="width: 15px; height: 15px;"></i>
          <span>Theo hệ thống</span>
        </button>
      </div>

      <div class="settings-privacy-row">
        <div class="flex items-center gap-3">
          <div class="settings-privacy-icon">
            <i data-lucide="${isBalanceVisible ? 'eye' : 'eye-off'}" style="width: 18px; height: 18px;"></i>
          </div>
          <div>
            <div class="font-medium" style="font-size: var(--font-size-sm); color: var(--text-primary);">Che số dư nhạy cảm</div>
            <small class="text-muted" style="font-size: 11px;">Mặc định ẩn số tiền trên thẻ Tổng quan để bảo mật</small>
          </div>
        </div>
        <button type="button" class="btn-v2 btn-v2-secondary" id="btn-toggle-privacy-all" style="padding: 6px 12px; font-size: var(--font-size-xs);">
          <span>${isBalanceVisible ? 'Đang hiện' : 'Đang ẩn'}</span>
        </button>
      </div>
    </div>
  `;
}

export function bindAppearanceEvents(container, onUpdate) {
  // Theme segmented items
  container.querySelectorAll('[data-theme-choice]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const choice = e.currentTarget.getAttribute('data-theme-choice');
      if (choice) {
        setThemePreference(choice);
        const labelMap = { light: 'Chế độ Sáng ☀️', dark: 'Chế độ Tối 🌙', system: 'Theo hệ thống 💻' };
        showToast(`Đã chuyển chủ đề: ${labelMap[choice] || choice}`, 'info');
        if (typeof onUpdate === 'function') onUpdate();
      }
    });
  });

  // Privacy toggle
  container.querySelector('#btn-toggle-privacy-all')?.addEventListener('click', () => {
    const isCurrentlyVisible = isAmountVisible('dashboard_balance', true);
    const next = !isCurrentlyVisible;
    setAmountVisible('dashboard_balance', next);
    setAmountVisible('dashboard_income', next);
    setAmountVisible('dashboard_expense', next);
    setAmountVisible('dashboard_savings', next);
    setAmountVisible('dashboard_debts', next);
    showToast(next ? 'Đã bật hiển thị số tiền.' : 'Đã che số tiền nhạy cảm.', 'info');
    if (typeof onUpdate === 'function') onUpdate();
  });
}
