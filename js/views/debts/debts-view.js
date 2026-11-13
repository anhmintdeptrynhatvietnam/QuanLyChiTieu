/**
 * Debts & Loans View Component (Sổ Vay & Nợ)
 */
import { stateStore } from '../../state.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { escapeHtml } from '../../utils/helpers.js';
import { isAmountVisible, renderEyeButton, attachPrivacyListeners } from '../../utils/privacy.js';
import { refreshIcons } from '../../ui/icons.js';
import { openDebtSheet } from '../debt-sheet/debt-sheet.js';
import { openDebtDetailSheet } from './debt-detail-sheet.js';

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

  renderDebtCard(debt) {
    const isLend = debt.type === 'lend';
    const isPaid = debt.status === 'paid';
    const totalAmount = Number(debt.amount) || 0;
    const remAmount = Number(debt.remainingAmount) || 0;
    const paidAmount = Math.max(0, totalAmount - remAmount);
    const percent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = Boolean(debt.dueDate && !isPaid && debt.dueDate < today);
    const isVis = isAmountVisible(`debt_${debt.id}`);

    return `
      <div class="card-v2 debt-card-item ${isLend ? 'lend' : 'borrow'}" data-debt-id="${escapeHtml(debt.id)}">
        <div>
          <div class="debt-card-header">
            <span class="badge ${isLend ? 'badge-income' : 'badge-expense'} font-medium">
              ${isLend ? 'Cho vay' : 'Đi vay'}
            </span>
            <span class="badge ${isPaid ? 'badge-income' : 'badge-subtle'}">
              ${isPaid ? 'Đã hoàn tất' : `Đã trả ${percent}%`}
            </span>
          </div>

          <h3 class="debt-card-person">${escapeHtml(debt.personName)}</h3>
          
          <div style="margin: var(--space-2) 0;">
            <span class="text-secondary" style="font-size: 11px; display: block;">Còn lại cần ${isLend ? 'thu' : 'trả'}:</span>
            <div class="flex items-center gap-2">
              <div class="font-bold ${isPaid ? 'text-muted' : (isLend ? 'text-income' : 'text-expense')}" style="font-size: 1.25rem;">
                ${isVis ? formatCurrency(remAmount) : '<span class="masked-amount">••••••••</span>'}
              </div>
              ${renderEyeButton(`debt_${debt.id}`)}
            </div>
            <small class="text-muted" style="font-size: 11px;">Gốc: ${isVis ? formatCurrency(totalAmount) : '••••••••'}</small>
          </div>

          <div class="debt-progress-bar-bg">
            <div class="debt-progress-bar-fill" style="width: ${percent}%; background: ${isPaid ? 'var(--income-primary)' : 'var(--primary-500)'};"></div>
          </div>

          <div class="flex flex-col gap-1 text-muted" style="font-size: 11px; margin-top: var(--space-2);">
            <div>Ngày tạo: <strong>${formatDate(debt.createdAt)}</strong></div>
            ${debt.dueDate ? `
              <div class="${isOverdue ? 'debt-overdue' : ''}">
                Hạn trả: <strong>${formatDate(debt.dueDate)}</strong> ${isOverdue ? '(Quá hạn!)' : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <div style="margin-top: var(--space-3); border-top: 1px solid var(--border-subtle); padding-top: var(--space-2);">
          ${!isPaid ? `
            <button type="button" class="btn-v2 ${isLend ? 'btn-v2-primary' : 'btn-v2-secondary'} w-full btn-quick-repay" data-id="${escapeHtml(debt.id)}">
              <i data-lucide="${isLend ? 'download' : 'upload'}" style="width: 14px; height: 14px;"></i>
              <span>${isLend ? 'Thu nợ' : 'Trả nợ'}</span>
            </button>
          ` : `
            <div class="text-income font-medium text-center" style="font-size: 12px; padding: 4px 0;">
              ✓ Hoàn tất
            </div>
          `}
        </div>
      </div>
    `;
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
