/**
 * Wallets Management Component
 */
import { stateStore } from '../state.js';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/formatters.js';
import { escapeHtml } from '../utils/helpers.js';
import { attachModalA11y } from '../utils/modal-a11y.js';
import { isAmountVisible, renderEyeButton, attachPrivacyListeners } from '../utils/privacy.js';
import { confirmDialog } from './confirm-dialog.js';
import { showToast } from './toast.js';

export class Wallets {
  constructor(containerId = 'view-wallets') {
    this.container = document.getElementById(containerId);
    this.selectedWalletId = null;
    this.modalEl = null;
    this.init();
  }

  init() {
    this.createModalDOM();
    attachModalA11y(this.modalEl, 'wallet-modal-title', () => this.closeModal());
    this.render();
    this.bindEvents();
    stateStore.subscribe((event) => {
      if (event.startsWith('wallet:') || event.startsWith('transaction:') || event === 'data:imported') {
        this.render();
      }
    });
  }

  createModalDOM() {
    const modalHTML = `
      <div id="wallet-modal" class="modal-overlay">
        <div class="modal-content">
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-4);">
            <h3 id="wallet-modal-title">Thêm Ví Mới</h3>
            <button type="button" class="btn btn-icon" id="btn-close-wallet-modal" aria-label="Đóng">
              <i data-lucide="x" style="width: 18px; height: 18px;"></i>
            </button>
          </div>

          <form id="wallet-form">
            <div class="form-group">
              <label class="form-label">Tên Ví / Tài khoản *</label>
              <input type="text" id="wallet-name" class="form-input" placeholder="Ví dụ: MB Bank, Tiền tiết kiệm..." required>
            </div>

            <div class="form-group">
              <label class="form-label">Loại Ví</label>
              <select id="wallet-type" class="form-select">
                <option value="cash">Tiền mặt (Cash)</option>
                <option value="bank">Tài khoản Ngân hàng (Bank)</option>
                <option value="credit">Thẻ tín dụng (Credit Card - Chi tiêu trước trả sau)</option>
                <option value="saving">Sổ tiết kiệm (Saving)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" id="wallet-balance-label">Số dư ban đầu (VNĐ) *</label>
              <input type="text" id="wallet-initial-balance" class="form-input font-bold" placeholder="0" required>
              <small id="wallet-balance-hint" class="text-muted" style="display: block; margin-top: 4px; font-size: 11px;">Số tiền hiện có trong ví.</small>
            </div>

            <div class="flex gap-3 justify-between" style="margin-top: var(--space-6);">
              <button type="button" class="btn btn-secondary" id="btn-cancel-wallet">Hủy</button>
              <button type="submit" class="btn btn-primary" style="flex: 1;">Lưu Ví</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalEl = document.getElementById('wallet-modal');
  }

  render() {
    const state = stateStore.getState();
    const assetWallets = state.wallets.filter(w => w.type !== 'credit');
    const totalBalance = assetWallets.reduce((acc, w) => acc + (Number(w.currentBalance) || 0), 0);
    const isTotalVisible = isAmountVisible('wallets_total_balance');

    this.container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Header Actions -->
        <div class="card flex items-center justify-between" style="flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <div class="flex items-center gap-2">
              <h2 style="font-size: 1.25rem;">Tổng Tài Sản Thực Có</h2>
              <span class="badge badge-subtle" style="font-size: 11px;">Không tính thẻ tín dụng</span>
            </div>
            <div class="flex items-center gap-2" style="margin-top: 4px;">
              <div style="font-size: 1.75rem; font-weight: 700; color: var(--primary-600);">
                ${isTotalVisible ? formatCurrency(totalBalance) : '<span class="masked-amount font-bold">••••••••</span>'}
              </div>
              ${renderEyeButton('wallets_total_balance')}
            </div>
            <small class="text-muted">Tổng số dư từ ${assetWallets.length} ví tài sản (Tiền mặt, Ngân hàng, Tiết kiệm)</small>
          </div>
          <button type="button" class="btn btn-primary" id="btn-open-add-wallet">
            <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>
            <span>Thêm Ví Mới</span>
          </button>
        </div>

        <!-- Wallets Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4);">
          ${state.wallets.map(w => this.renderWalletCard(w)).join('')}
        </div>
      </div>
    `;

    this.bindCardEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  renderWalletCard(wallet) {
    const isCredit = wallet.type === 'credit';
    const typeLabel = {
      cash: 'Tiền mặt',
      bank: 'Ngân hàng',
      credit: 'Thẻ tín dụng',
      saving: 'Tiết kiệm'
    }[wallet.type] || 'Ví';

    const isWalletVisible = isAmountVisible(`wallet_${wallet.id}`);

    let balanceDisplay = '';
    if (isCredit) {
      if (wallet.currentBalance < 0) {
        balanceDisplay = `<div class="font-bold text-expense" style="font-size: 1.5rem;">Dư nợ: ${formatCurrency(Math.abs(wallet.currentBalance))}</div>`;
      } else if (wallet.currentBalance === 0) {
        balanceDisplay = `<div class="font-bold text-secondary" style="font-size: 1.5rem;">0 ₫ (Không nợ)</div>`;
      } else {
        balanceDisplay = `<div class="font-bold text-primary" style="font-size: 1.5rem;">${formatCurrency(wallet.currentBalance)}</div>`;
      }
    } else {
      balanceDisplay = `<div class="font-bold text-primary" style="font-size: 1.5rem;">${formatCurrency(wallet.currentBalance)}</div>`;
    }

    return `
      <div class="card" style="border-top: 4px solid ${wallet.color || 'var(--primary-500)'};">
        <div class="flex items-center justify-between" style="margin-bottom: var(--space-3);">
          <div class="flex items-center gap-2">
            <div class="badge badge-subtle font-medium">${typeLabel}</div>
            ${isCredit ? '<span class="badge badge-subtle" style="font-size: 10px; color: var(--text-muted);">Không tính tài sản</span>' : ''}
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-icon btn-edit-wallet" data-id="${wallet.id}" title="Sửa" aria-label="Sửa ví ${escapeHtml(wallet.name)}">
              <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
            </button>
            <button type="button" class="btn btn-icon btn-delete-wallet" data-id="${wallet.id}" title="Xóa" aria-label="Xóa ví ${escapeHtml(wallet.name)}" style="color: var(--expense-primary);">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </div>

        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-2);">${escapeHtml(wallet.name)}</h3>
        <div class="flex items-center gap-2">
          ${isWalletVisible ? balanceDisplay : `<div class="font-bold text-primary" style="font-size: 1.5rem;"><span class="masked-amount">••••••••</span></div>`}
          ${renderEyeButton(`wallet_${wallet.id}`)}
        </div>
        <small class="text-muted" style="display: block; margin-top: 4px;">
          ${isCredit ? `Hạn mức / Dư nợ đầu: ${isWalletVisible ? formatCurrency(wallet.initialBalance) : '••••••••'}` : `Số dư ban đầu: ${isWalletVisible ? formatCurrency(wallet.initialBalance) : '••••••••'}`}
        </small>
      </div>
    `;
  }

  bindEvents() {
    const closeBtn = document.getElementById('btn-close-wallet-modal');
    const cancelBtn = document.getElementById('btn-cancel-wallet');
    const form = document.getElementById('wallet-form');
    const initialInput = document.getElementById('wallet-initial-balance');
    const typeSelect = document.getElementById('wallet-type');

    closeBtn.addEventListener('click', () => this.closeModal());
    cancelBtn.addEventListener('click', () => this.closeModal());

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.closeModal();
    });

    typeSelect.addEventListener('change', () => {
      this.updateModalFieldHints();
    });

    initialInput.addEventListener('input', (e) => {
      const clean = String(e.target.value).replace(/\D/g, '');
      if (!clean) {
        e.target.value = '';
        return;
      }
      const raw = parseFormattedNumber(clean);
      e.target.value = formatNumber(raw);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });
  }

  updateModalFieldHints() {
    const typeSelect = document.getElementById('wallet-type');
    const balanceLabel = document.getElementById('wallet-balance-label');
    const balanceHint = document.getElementById('wallet-balance-hint');
    if (!typeSelect || !balanceLabel || !balanceHint) return;

    if (typeSelect.value === 'credit') {
      balanceLabel.textContent = 'Hạn mức / Dư nợ ban đầu (VNĐ)';
      balanceHint.textContent = '⚡ Thẻ tín dụng tiêu trước trả sau, không được tính cộng vào Tổng tài sản.';
    } else {
      balanceLabel.textContent = 'Số dư ban đầu (VNĐ) *';
      balanceHint.textContent = 'Số tiền thực tế hiện có trong ví.';
    }
  }

  bindCardEvents() {
    const addBtn = this.container.querySelector('#btn-open-add-wallet');
    if (addBtn) addBtn.addEventListener('click', () => this.openModal());

    this.container.querySelectorAll('.btn-edit-wallet').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openModal(id);
      });
    });

    this.container.querySelectorAll('.btn-delete-wallet').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const confirmed = await confirmDialog('Bạn có chắc chắn muốn xóa ví này?', { danger: true });
        if (confirmed) {
          const res = stateStore.deleteWallet(id);
          if (!res.success) showToast(res.reason, 'error');
        }
      });
    });

    // Attach privacy toggle listeners for eye buttons
    attachPrivacyListeners(this.container, () => this.render());
  }

  openModal(walletId = null) {
    this.selectedWalletId = walletId;
    const titleEl = document.getElementById('wallet-modal-title');
    const nameInput = document.getElementById('wallet-name');
    const typeSelect = document.getElementById('wallet-type');
    const initialInput = document.getElementById('wallet-initial-balance');

    if (walletId) {
      const state = stateStore.getState();
      const wallet = state.wallets.find(w => w.id === walletId);
      if (!wallet) return;

      titleEl.textContent = 'Chỉnh Sửa Ví';
      nameInput.value = wallet.name;
      typeSelect.value = wallet.type;
      initialInput.value = formatNumber(wallet.initialBalance);
    } else {
      titleEl.textContent = 'Thêm Ví Mới';
      nameInput.value = '';
      typeSelect.value = 'bank';
      initialInput.value = '';
    }

    this.updateModalFieldHints();
    this.modalEl.classList.add('active');
    setTimeout(() => nameInput.focus(), 150);
  }

  closeModal() {
    this.modalEl.classList.remove('active');
    this.selectedWalletId = null;
  }

  handleFormSubmit() {
    const name = document.getElementById('wallet-name').value.trim();
    const type = document.getElementById('wallet-type').value;
    const initialBalance = parseFormattedNumber(document.getElementById('wallet-initial-balance').value);

    if (!name) {
      showToast('Vui lòng nhập tên ví', 'error');
      return;
    }

    if (this.selectedWalletId) {
      stateStore.updateWallet(this.selectedWalletId, { name, type, initialBalance });
    } else {
      stateStore.addWallet({ name, type, initialBalance });
    }

    this.closeModal();
  }
}
