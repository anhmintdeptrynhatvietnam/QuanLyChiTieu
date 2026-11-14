/**
 * Wallets View Component (Sổ ví & Tài khoản)
 */
import { stateStore } from '../../state.js';
import { formatCurrency } from '../../utils/formatters.js';
import { escapeHtml, safeColor } from '../../utils/helpers.js';
import { isAmountVisible, renderEyeButton, attachPrivacyListeners } from '../../utils/privacy.js';
import { confirmDialog } from '../../components/confirm-dialog.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../ui/icons.js';
import { openWalletSheet } from './wallet-sheet.js';
import { openTransactionSheet } from '../transaction-sheet/transaction-sheet.js';

export class WalletsView {
  constructor(containerId = 'view-wallets') {
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    this.render();
    stateStore.subscribe((event) => {
      if (event.startsWith('wallet:') || event.startsWith('transaction:') || event.startsWith('debt:') ||
          event === 'data:imported' || event === 'data:replaced' || event === 'remote:synced') {
        this.render();
      }
    });
  }

  render() {
    if (!this.container) return;
    const state = stateStore.getState();
    const wallets = state.wallets || [];
    const assetWallets = wallets.filter(w => w.type !== 'credit');
    const totalBalance = assetWallets.reduce((acc, w) => acc + (Number(w.currentBalance) || 0), 0);
    const isTotalVisible = isAmountVisible('wallets_total_balance');

    this.container.innerHTML = `
      <div class="wallets-view">
        <div class="card-v2 wallets-total-card">
          <div class="wallets-total-info">
            <div class="wallets-total-header">
              <h2 class="wallets-total-title">Tổng Tài Sản Thực Có</h2>
              <span class="badge badge-subtle" style="font-size: 11px;">Không tính thẻ tín dụng</span>
            </div>
            <div class="wallets-total-amount-row">
              <div class="wallets-total-amount">
                ${isTotalVisible ? formatCurrency(totalBalance) : '<span class="masked-amount font-bold">••••••••</span>'}
              </div>
              ${renderEyeButton('wallets_total_balance')}
            </div>
            <small class="text-muted">Tổng số dư từ ${assetWallets.length} ví tài sản (Tiền mặt, Ngân hàng, Tiết kiệm)</small>
          </div>
          <div class="wallets-total-actions">
            <button type="button" class="btn-v2 btn-v2-secondary" id="btn-wallets-transfer">
              <i data-lucide="arrow-left-right" style="width: 16px; height: 16px;"></i>
              <span>Chuyển tiền</span>
            </button>
            <button type="button" class="btn-v2 btn-v2-primary" id="btn-open-add-wallet">
              <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>
              <span>Thêm Ví Mới</span>
            </button>
          </div>
        </div>

        <div class="wallets-grid">
          ${wallets.map(w => this.renderWalletCard(w)).join('')}
        </div>
      </div>
    `;

    this.bindEvents();
    refreshIcons(this.container);
  }

  renderWalletCard(wallet) {
    const isCredit = wallet.type === 'credit';
    const typeLabel = {
      cash: 'Tiền mặt',
      bank: 'Ngân hàng',
      credit: 'Thẻ tín dụng',
      saving: 'Tiết kiệm'
    }[wallet.type] || 'Ví';

    const isVisible = isAmountVisible(`wallet_${wallet.id}`);
    const balanceNum = Number(wallet.currentBalance) || 0;

    let balanceHtml = '';
    if (isCredit) {
      if (balanceNum < 0) {
        balanceHtml = `<div class="wallet-card-balance text-expense">Dư nợ: ${formatCurrency(Math.abs(balanceNum))}</div>`;
      } else if (balanceNum === 0) {
        balanceHtml = `<div class="wallet-card-balance text-secondary">0 ₫ (Không nợ)</div>`;
      } else {
        balanceHtml = `<div class="wallet-card-balance text-primary">${formatCurrency(balanceNum)}</div>`;
      }
    } else {
      balanceHtml = `<div class="wallet-card-balance text-primary">${formatCurrency(balanceNum)}</div>`;
    }


    return `
      <div class="card-v2 wallet-card-item" style="border-top-color: ${safeColor(wallet.color || '#3b82f6')};">
        <div>
          <div class="wallet-card-header">
            <div class="wallet-card-badges">
              <span class="badge badge-subtle font-medium">${typeLabel}</span>
              ${isCredit ? '<span class="badge badge-subtle" style="font-size: 10px; color: var(--text-muted);">Không tính tài sản</span>' : ''}
            </div>
            <div class="wallet-card-actions">
              <button type="button" class="wallet-action-btn btn-edit-wallet" data-id="${escapeHtml(wallet.id)}" title="Sửa" aria-label="Sửa ví ${escapeHtml(wallet.name)}">
                <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
              </button>
              <button type="button" class="wallet-action-btn btn-delete btn-delete-wallet" data-id="${escapeHtml(wallet.id)}" title="Xóa" aria-label="Xóa ví ${escapeHtml(wallet.name)}">
                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
              </button>
            </div>
          </div>

          <h3 class="wallet-card-name">${escapeHtml(wallet.name)}</h3>
          <div class="wallet-card-balance-row">
            ${isVisible ? balanceHtml : '<div class="wallet-card-balance text-primary"><span class="masked-amount">••••••••</span></div>'}
            ${renderEyeButton(`wallet_${wallet.id}`)}
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const addBtn = this.container.querySelector('#btn-open-add-wallet');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        openWalletSheet({ onDone: () => this.render() });
      });
    }

    const transferBtn = this.container.querySelector('#btn-wallets-transfer');
    if (transferBtn) {
      transferBtn.addEventListener('click', () => {
        openTransactionSheet({ type: 'transfer' });
      });
    }

    this.container.querySelectorAll('.btn-edit-wallet').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) openWalletSheet({ walletId: id, onDone: () => this.render() });
      });
    });

    this.container.querySelectorAll('.btn-delete-wallet').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const confirmed = await confirmDialog('Bạn có chắc chắn muốn xóa ví này?', { danger: true });
        if (confirmed) {
          const res = stateStore.deleteWallet(id);
          if (!res.success) {
            showToast(res.reason, 'error');
          } else {
            showToast('Đã xóa ví thành công', 'success');
          }
        }
      });
    });

    attachPrivacyListeners(this.container, () => this.render());
  }
}
