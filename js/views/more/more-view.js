/**
 * More View Component ("Thêm" Screen)
 * Menu list for secondary sections: Wallets, Debts, Budgets, Settings & Sync.
 */
import { navigate } from '../../ui/router.js';

export class MoreView {
  constructor(containerId = 'view-more') {
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    this.render();
  }

  getCloudStatusText() {
    const badgeTextEl = document.getElementById('sync-status-text');
    return badgeTextEl ? badgeTextEl.textContent.trim() : 'Chưa kết nối Cloud';
  }

  render() {
    if (!this.container) return;

    const cloudText = this.getCloudStatusText();

    this.container.innerHTML = `
      <div class="flex flex-col gap-4" style="max-width: 600px; margin: 0 auto;">
        <!-- Secondary Navigation List -->
        <div class="card-v2" style="padding: 0; overflow: hidden;">
          <button type="button" class="row-v2" data-more-nav="wallets" style="cursor: pointer; border: none; width: 100%; text-align: left;">
            <div class="flex items-center gap-3">
              <div class="icon-avatar" style="width: 38px; height: 38px; border-radius: var(--radius-md); background: var(--primary-50); color: var(--primary-500); display: flex; align-items: center; justify-content: center;">
                <i data-lucide="wallet" style="width: 20px; height: 20px;"></i>
              </div>
              <div>
                <div style="font-weight: 600; font-size: var(--font-size-sm); color: var(--text-primary);">Ví & Tài khoản</div>
                <small class="text-muted" style="font-size: 11px;">Quản lý tiền mặt, ngân hàng, thẻ tín dụng</small>
              </div>
            </div>
            <i data-lucide="chevron-right" style="width: 18px; height: 18px; color: var(--text-muted);"></i>
          </button>

          <button type="button" class="row-v2" data-more-nav="debts" style="cursor: pointer; border: none; width: 100%; text-align: left;">
            <div class="flex items-center gap-3">
              <div class="icon-avatar" style="width: 38px; height: 38px; border-radius: var(--radius-md); background: var(--income-bg); color: var(--income-primary); display: flex; align-items: center; justify-content: center;">
                <i data-lucide="hand-coins" style="width: 20px; height: 20px;"></i>
              </div>
              <div>
                <div style="font-weight: 600; font-size: var(--font-size-sm); color: var(--text-primary);">Sổ Vay & Nợ</div>
                <small class="text-muted" style="font-size: 11px;">Theo dõi cho vay, nợ phải trả, ghi nhận hoàn tất</small>
              </div>
            </div>
            <i data-lucide="chevron-right" style="width: 18px; height: 18px; color: var(--text-muted);"></i>
          </button>

          <button type="button" class="row-v2" data-more-nav="budgets" style="cursor: pointer; border: none; width: 100%; text-align: left;">
            <div class="flex items-center gap-3">
              <div class="icon-avatar" style="width: 38px; height: 38px; border-radius: var(--radius-md); background: var(--warning-bg); color: var(--warning-primary); display: flex; align-items: center; justify-content: center;">
                <i data-lucide="pie-chart" style="width: 20px; height: 20px;"></i>
              </div>
              <div>
                <div style="font-weight: 600; font-size: var(--font-size-sm); color: var(--text-primary);">Hạn mức ngân sách</div>
                <small class="text-muted" style="font-size: 11px;">Thiết lập định mức chi tiêu theo hạng mục</small>
              </div>
            </div>
            <i data-lucide="chevron-right" style="width: 18px; height: 18px; color: var(--text-muted);"></i>
          </button>

          <button type="button" class="row-v2" data-more-nav="settings" style="cursor: pointer; border: none; width: 100%; text-align: left;">
            <div class="flex items-center gap-3">
              <div class="icon-avatar" style="width: 38px; height: 38px; border-radius: var(--radius-md); background: var(--bg-subtle); color: var(--text-secondary); display: flex; align-items: center; justify-content: center;">
                <i data-lucide="settings" style="width: 20px; height: 20px;"></i>
              </div>
              <div>
                <div style="font-weight: 600; font-size: var(--font-size-sm); color: var(--text-primary);">Cài đặt & Đồng bộ</div>
                <small class="text-muted" style="font-size: 11px;">Sao lưu, xuất dữ liệu, cấu hình Firebase Cloud</small>
              </div>
            </div>
            <i data-lucide="chevron-right" style="width: 18px; height: 18px; color: var(--text-muted);"></i>
          </button>
        </div>

        <!-- Cloud Sync Summary Card -->
        <div class="card-v2 flex items-center justify-between" id="more-cloud-summary" style="cursor: pointer; padding: var(--space-3) var(--space-4);">
          <div class="flex items-center gap-2">
            <i data-lucide="cloud" style="width: 16px; height: 16px; color: var(--primary-500);"></i>
            <span class="font-medium" style="font-size: var(--font-size-xs); color: var(--text-secondary);">Trạng thái Cloud:</span>
            <span class="font-semibold" style="font-size: var(--font-size-xs); color: var(--text-primary);">${cloudText}</span>
          </div>
          <span class="badge badge-subtle" style="font-size: 11px;">Cài đặt</span>
        </div>
      </div>
    `;

    this.bindEvents();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  bindEvents() {
    this.container.querySelectorAll('[data-more-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-more-nav');
        if (target) navigate(target);
      });
    });

    const cloudCard = this.container.querySelector('#more-cloud-summary');
    if (cloudCard) {
      cloudCard.addEventListener('click', () => navigate('settings'));
    }
  }
}
