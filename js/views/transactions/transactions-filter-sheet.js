/**
 * Advanced Filter Bottom Sheet
 * Segmented control for type, Category Grid, and Wallet Picker.
 */
import { openSheet } from '../../ui/bottom-sheet.js';
import { renderCategoryGrid } from '../../ui/category-grid.js';
import { renderWalletPicker } from '../../ui/wallet-picker.js';
import { refreshIcons } from '../../ui/icons.js';

export function openFilterSheet({
  type = 'all',
  categoryId = 'all',
  walletId = 'all',
  categories = [],
  wallets = [],
  onApply = null,
  onReset = null
} = {}) {
  let curType = type;
  let curCat = categoryId;
  let curWallet = walletId;

  const content = document.createElement('div');
  content.className = 'tx-filter-sheet-body flex flex-col gap-4';

  function renderSections() {
    content.innerHTML = `
      <div class="filter-sheet-section">
        <label class="filter-section-title">Loại giao dịch</label>
        <div class="segmented" id="filter-type-segmented" role="radiogroup">
          <button type="button" class="segmented-item${curType === 'all' ? ' active' : ''}" data-type="all">Tất cả</button>
          <button type="button" class="segmented-item${curType === 'expense' ? ' active' : ''}" data-type="expense">Chi tiêu</button>
          <button type="button" class="segmented-item${curType === 'income' ? ' active' : ''}" data-type="income">Thu nhập</button>
          <button type="button" class="segmented-item${curType === 'transfer' ? ' active' : ''}" data-type="transfer">Chuyển ví</button>
        </div>
      </div>

      <div class="filter-sheet-section">
        <div class="flex items-center justify-between mb-1">
          <label class="filter-section-title">Ví / Tài khoản</label>
          <button type="button" id="btn-filter-all-wallets" class="filter-clear-link${curWallet === 'all' ? ' active' : ''}">Tất cả ví</button>
        </div>
        <div id="filter-wallet-picker-host"></div>
      </div>

      <div class="filter-sheet-section" id="filter-category-section" style="${curType === 'transfer' ? 'display: none;' : ''}">
        <div class="flex items-center justify-between mb-1">
          <label class="filter-section-title">Hạng mục</label>
          <button type="button" id="btn-filter-all-categories" class="filter-clear-link${curCat === 'all' ? ' active' : ''}">Tất cả mục</button>
        </div>
        <div id="filter-category-grid-host"></div>
      </div>

      <div class="filter-sheet-actions flex items-center gap-3 pt-2">
        <button type="button" id="btn-sheet-reset-filter" class="btn-v2 btn-v2-secondary" style="flex: 1;">
          <i data-lucide="rotate-ccw" style="width: 16px; height: 16px;"></i>
          <span>Xóa lọc</span>
        </button>
        <button type="button" id="btn-sheet-apply-filter" class="btn-v2 btn-v2-primary" style="flex: 2;">
          <i data-lucide="check" style="width: 16px; height: 16px;"></i>
          <span>Áp dụng</span>
        </button>
      </div>
    `;

    const walletHost = content.querySelector('#filter-wallet-picker-host');
    if (walletHost) {
      walletHost.appendChild(renderWalletPicker({
        wallets,
        selectedId: curWallet === 'all' ? null : curWallet,
        showBalance: true,
        onSelect: (wId) => { curWallet = String(wId); }
      }));
    }

    const catHost = content.querySelector('#filter-category-grid-host');
    if (catHost && curType !== 'transfer') {
      const catType = (curType === 'expense' || curType === 'income') ? curType : null;
      catHost.appendChild(renderCategoryGrid({
        categories,
        type: catType,
        selectedId: curCat === 'all' ? null : curCat,
        onSelect: (cId) => { curCat = String(cId); }
      }));
    }

    content.querySelectorAll('#filter-type-segmented .segmented-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const selectedType = btn.getAttribute('data-type');
        if (selectedType !== curType) {
          curType = selectedType;
          if (curType === 'transfer') curCat = 'all';
          renderSections();
          refreshIcons(content);
        }
      });
    });

    content.querySelector('#btn-filter-all-wallets')?.addEventListener('click', () => {
      curWallet = 'all';
      renderSections();
      refreshIcons(content);
    });

    content.querySelector('#btn-filter-all-categories')?.addEventListener('click', () => {
      curCat = 'all';
      renderSections();
      refreshIcons(content);
    });

    content.querySelector('#btn-sheet-reset-filter')?.addEventListener('click', () => {
      curType = 'all';
      curCat = 'all';
      curWallet = 'all';
      if (typeof onReset === 'function') onReset();
      sheet.close({ reset: true });
    });

    content.querySelector('#btn-sheet-apply-filter')?.addEventListener('click', () => {
      if (typeof onApply === 'function') {
        onApply({ type: curType, categoryId: curCat, walletId: curWallet });
      }
      sheet.close({ applied: true });
    });
  }

  renderSections();
  const sheet = openSheet({ title: 'Bộ lọc giao dịch', content });
  refreshIcons(content);
  return sheet;
}
