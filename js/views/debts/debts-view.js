/**
 * Debts & Loans View Component (Sổ Vay & Nợ)
 */
import { stateStore } from '../../state.js';
import { formatCurrency } from '../../utils/formatters.js';
import { isAmountVisible, renderEyeButton, attachPrivacyListeners } from '../../utils/privacy.js';
import { refreshIcons } from '../../ui/icons.js';
import { openDebtSheet } from '../debt-sheet/debt-sheet.js';
import { openDebtDetailSheet } from './debt-detail-sheet.js';
import { renderDebtCard } from './debt-card.js';

export class DebtsView {
  constructor(containerId = 'view-debts') {
    this.container = document.getElementById(containerId);
    this.activeFilter = 'all'; // 'all' | 'lend' | 'borrow' | 'unpaid' | 'paid'
    this.init();
  }

  init() {
    this.render();
    stateStore.subscribe((event) => {
      if (event.startsWith('debt:') || event === 'data:imported' ||
          event === 'data:replaced' || event === 'remote:synced') {
        this.render();
      }
    });
  }

  renderDebtCard(debt) {
    return renderDebtCard(debt);
  }

  render() {
    if (!this.container) return;
    const state = stateStore.getState();
    const debts = state.debts || [];

    const totalLend = debts.filter(d => d.type === 'lend' && d.status !== 'paid')
      .reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);
    const totalBorrow = debts.filter(d => d.type === 'borrow' && d.status !== 'paid')
      .reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);

    let filtered = [...debts];
    if (this.activeFilter === 'lend') filtered = filtered.filter(d => d.type === 'lend');
    else if (this.activeFilter === 'borrow') filtered = filtered.filter(d => d.type === 'borrow');
    else if (this.activeFilter === 'unpaid') filtered = filtered.filter(d => d.status !== 'paid');
    else if (this.activeFilter === 'paid') filtered = filtered.filter(d => d.status === 'paid');

    const isLendVis = isAmountVisible('debts_total_lend');
    const isBorrowVis = isAmountVisible('debts_total_borrow');

    this.container.innerHTML = `
      <div class="debts-view">
        <div class="debts-summary-grid">
          <div class="card-v2 debts-summary-card lend">
            <div class="debts-summary-header">
              <span class="debts-summary-title">Họ Đang Nợ Tôi (Cần Thu)</span>
              <span class="badge badge-income font-medium">Cho vay</span>
            </div>
            <div class="debts-summary-amount-row">
              <div class="debts-summary-amount lend">
                ${isLendVis ? formatCurrency(totalLend) : '<span class="masked-amount">••••••••</span>'}
              </div>
              ${renderEyeButton('debts_total_lend')}
            </div>
            <small class="text-muted">Tiền đã cho vay hoặc mua hộ chưa thu về</small>
          </div>

          <div class="card-v2 debts-summary-card borrow">
            <div class="debts-summary-header">
              <span class="debts-summary-title">Tôi Đang Nợ Họ (Cần Trả)</span>
              <span class="badge badge-expense font-medium">Đi vay</span>
            </div>
            <div class="debts-summary-amount-row">
              <div class="debts-summary-amount borrow">
                ${isBorrowVis ? formatCurrency(totalBorrow) : '<span class="masked-amount">••••••••</span>'}
              </div>
              ${renderEyeButton('debts_total_borrow')}
            </div>
            <small class="text-muted">Tiền đang đi vay mượn cần hoàn trả</small>
          </div>
        </div>

        <div class="card-v2 debts-action-bar">
          <div class="debts-filters">
            ${[
              { id: 'all', label: `Tất cả (${debts.length})` },
              { id: 'lend', label: 'Cho vay' },
              { id: 'borrow', label: 'Đi vay' },
              { id: 'unpaid', label: 'Chưa xong' },
              { id: 'paid', label: 'Đã hoàn tất' }
            ].map(f => `
              <button type="button" class="debt-filter-chip${this.activeFilter === f.id ? ' active' : ''}" data-filter="${f.id}">
                ${f.label}
              </button>
            `).join('')}
          </div>
          <button type="button" class="btn-v2 btn-v2-primary" id="btn-open-create-debt">
            <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>
            <span>Tạo Khoản Vay / Nợ</span>
          </button>
        </div>

        <div class="debts-grid">
          ${filtered.length === 0 ? `
            <div class="card-v2" style="grid-column: 1 / -1; text-align: center; padding: var(--space-8) var(--space-4);">
              <i data-lucide="receipt-text" style="width: 40px; height: 40px; color: var(--text-muted); margin-bottom: 8px;"></i>
              <h3 style="font-size: var(--font-size-base); color: var(--text-secondary); margin: 0 0 4px;">Chưa có khoản vay / nợ nào</h3>
              <small class="text-muted">Nhấn "Tạo Khoản Vay / Nợ" để bắt đầu theo dõi.</small>
            </div>
          ` : filtered.map(d => this.renderDebtCard(d)).join('')}
        </div>
      </div>
    `;

    this.bindEvents();
    refreshIcons(this.container);
  }

  bindEvents() {
    const createBtn = this.container.querySelector('#btn-open-create-debt');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        openDebtSheet({ action: 'lend' });
      });
    }

    this.container.querySelectorAll('.debt-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.activeFilter = chip.getAttribute('data-filter') || 'all';
        this.render();
      });
    });

    this.container.querySelectorAll('.debt-card-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-quick-repay') || e.target.closest('.btn-eye-toggle')) return;
        const debtId = card.getAttribute('data-debt-id');
        if (debtId) openDebtDetailSheet({ debtId, onDone: () => this.render() });
      });
    });

    this.container.querySelectorAll('.btn-quick-repay').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const state = stateStore.getState();
        const debt = state.debts?.find(d => d.id === id);
        if (debt) {
          openDebtSheet({
            action: debt.type === 'lend' ? 'collect' : 'repay',
            debtId: debt.id
          });
        }
      });
    });

    attachPrivacyListeners(this.container, () => this.render());
  }
}
