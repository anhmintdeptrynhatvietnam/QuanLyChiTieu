/**
 * Budgets Management Component
 */
import { stateStore } from '../state.js';
import { formatCurrency, formatNumber, parseFormattedNumber, getMonthYear, formatMonthYearDisplay } from '../utils/formatters.js';
import { escapeHtml, safeColor, safeIconName } from '../utils/helpers.js';
import { attachModalA11y } from '../utils/modal-a11y.js';
import { confirmDialog } from './confirm-dialog.js';

export class Budgets {
  constructor(containerId = 'view-budgets') {
    this.container = document.getElementById(containerId);
    this.selectedMonth = getMonthYear();
    this.modalEl = null;
    this.activeCategoryId = null;
    this.init();
  }

  init() {
    this.createModalDOM();
    this.render();
    this.bindEvents();
    stateStore.subscribe((event) => {
      if (event.startsWith('budget:') || event.startsWith('transaction:') || event === 'data:imported') {
        this.render();
      }
    });
  }

  createModalDOM() {
    const modalHTML = `
      <div id="budget-modal" class="modal-overlay">
        <div class="modal-content">
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-4);">
            <h3 id="budget-modal-title">Đặt Hạn Mức Chi Tiêu</h3>
            <button type="button" class="btn btn-icon" id="btn-close-budget-modal" aria-label="Đóng">
              <i data-lucide="x" style="width: 18px; height: 18px;"></i>
            </button>
          </div>

          <form id="budget-form">
            <div class="form-group">
              <label class="form-label">Hạng mục</label>
              <input type="text" id="budget-cat-name" class="form-input" disabled style="background: var(--bg-subtle);">
            </div>

            <div class="form-group">
              <label class="form-label">Tháng áp dụng</label>
              <input type="month" id="budget-month" class="form-input" required>
            </div>

            <div class="form-group">
              <label class="form-label">Hạn mức tối đa (VNĐ) *</label>
              <input type="text" id="budget-limit-amount" class="form-input font-bold" placeholder="0" required>
            </div>

            <div class="flex gap-3 justify-between" style="margin-top: var(--space-6);">
              <button type="button" class="btn btn-secondary" id="btn-delete-budget" style="display: none;">
                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                <span>Xóa hạn mức</span>
              </button>
              <button type="button" class="btn btn-secondary" id="btn-cancel-budget">Hủy</button>
              <button type="submit" class="btn btn-primary" style="flex: 1;">Lưu Ngân Sách</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalEl = document.getElementById('budget-modal');
    attachModalA11y(this.modalEl, 'budget-modal-title', () => this.closeModal());
  }

  render() {
    const state = stateStore.getState();
    const expenseCategories = state.categories.filter(c => c.type === 'expense');

    // Calculate spend per category for the selected month
    const spendMap = {};
    let totalBudget = 0;
    let totalSpent = 0;

    state.transactions.forEach(t => {
      if (t.type === 'expense' && t.date && t.date.startsWith(this.selectedMonth)) {
        spendMap[t.categoryId] = (spendMap[t.categoryId] || 0) + (Number(t.amount) || 0);
        totalSpent += Number(t.amount) || 0;
      }
    });

    state.budgets.forEach(b => {
      if (b.month === this.selectedMonth) {
        totalBudget += Number(b.limitAmount) || 0;
      }
    });

    this.container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Month Selector & Summary Card -->
        <div class="card flex items-center justify-between" style="flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <span class="text-muted" style="font-size: var(--font-size-xs);">Ngân sách tháng</span>
            <h2 style="font-size: 1.25rem;">${formatMonthYearDisplay(this.selectedMonth)}</h2>
            <div class="flex gap-4" style="margin-top: var(--space-2);">
              <small class="text-secondary">Đã chi: <strong class="text-expense">${formatCurrency(totalSpent)}</strong></small>
              <small class="text-secondary">Hạn mức: <strong>${formatCurrency(totalBudget)}</strong></small>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input type="month" id="budget-view-month" class="form-input" value="${escapeHtml(this.selectedMonth)}" style="width: auto;">
          </div>
        </div>

        <!-- Budget Items List -->
        <div class="flex flex-col gap-4">
          ${expenseCategories.map(cat => this.renderBudgetItem(cat, spendMap[cat.id] || 0, state)).join('')}
        </div>
      </div>
    `;

    this.bindCardEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  renderBudgetItem(category, spent, state) {
    const budgetObj = state.budgets.find(b => b.categoryId === category.id && b.month === this.selectedMonth);
    const limit = budgetObj ? Number(budgetObj.limitAmount) : 0;
    const hasBudget = limit > 0;
    const percent = hasBudget ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
    const isOver = hasBudget && spent > limit;

    let statusColor = 'var(--income-primary)'; // Green
    let statusText = `${percent}%`;

    if (isOver) {
      statusColor = 'var(--expense-primary)';
      statusText = `Vượt ${formatCurrency(spent - limit)}!`;
    } else if (percent >= 80) {
      statusColor = 'var(--warning-primary)';
    }

    return `
      <div class="card" style="padding: var(--space-4);">
        <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
          <div class="flex items-center gap-3">
            <div class="icon-avatar" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--bg-subtle);">
              <i data-lucide="${safeIconName(category.icon || 'tag')}" style="width: 18px; height: 18px; color: ${safeColor(category.color)};"></i>
            </div>
            <div>
              <h4 style="font-size: var(--font-size-base); font-weight: 600;">${escapeHtml(category.name)}</h4>
              <small class="text-muted">Đã chi: <strong>${formatCurrency(spent)}</strong> / ${hasBudget ? formatCurrency(limit) : 'Chưa đặt hạn mức'}</small>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span class="badge ${isOver ? 'badge-expense' : 'badge-subtle'} font-bold" style="color: ${statusColor};">
              ${statusText}
            </span>
            <button type="button" class="btn btn-secondary btn-set-budget" data-cat-id="${escapeHtml(category.id)}" style="padding: 4px 10px; font-size: var(--font-size-xs);">
              ${hasBudget ? 'Sửa' : '+ Đặt mức'}
            </button>
          </div>
        </div>

        ${hasBudget ? `
          <div style="height: 8px; background: var(--bg-subtle); border-radius: var(--radius-full); overflow: hidden; margin-top: 6px;">
            <div style="width: ${percent}%; height: 100%; background: ${statusColor}; border-radius: var(--radius-full); transition: width 0.3s ease;"></div>
          </div>
        ` : ''}
      </div>
    `;
  }

  bindEvents() {
    const closeBtn = document.getElementById('btn-close-budget-modal');
    const cancelBtn = document.getElementById('btn-cancel-budget');
    const deleteBtn = document.getElementById('btn-delete-budget');
    const form = document.getElementById('budget-form');
    const limitInput = document.getElementById('budget-limit-amount');

    closeBtn.addEventListener('click', () => this.closeModal());
    cancelBtn.addEventListener('click', () => this.closeModal());

    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const confirmed = await confirmDialog('Xóa hạn mức của hạng mục này trong tháng đã chọn?', { danger: true });
        if (confirmed) {
          const month = document.getElementById('budget-month').value;
          stateStore.deleteBudget(this.activeCategoryId, month);
          this.closeModal();
        }
      });
    }

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.closeModal();
    });

    limitInput.addEventListener('input', (e) => {
      const clean = String(e.target.value).replace(/\D/g, '');
      if (!clean) {
        e.target.value = '';
        return;
      }
      const raw = parseFormattedNumber(clean);
      e.target.value = raw > 0 ? formatNumber(raw) : '';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });
  }

  bindCardEvents() {
    const monthPicker = this.container.querySelector('#budget-view-month');
    if (monthPicker) {
      monthPicker.addEventListener('change', (e) => {
        this.selectedMonth = e.target.value;
        this.render();
      });
    }

    this.container.querySelectorAll('.btn-set-budget').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.getAttribute('data-cat-id');
        this.openModal(catId);
      });
    });
  }

  openModal(categoryId) {
    this.activeCategoryId = categoryId;
    const state = stateStore.getState();
    const cat = state.categories.find(c => c.id === categoryId);
    const existingBudget = state.budgets.find(b => b.categoryId === categoryId && b.month === this.selectedMonth);

    document.getElementById('budget-cat-name').value = cat?.name || '';
    document.getElementById('budget-month').value = this.selectedMonth;
    document.getElementById('budget-limit-amount').value = existingBudget ? formatNumber(existingBudget.limitAmount) : '';

    const deleteBtn = document.getElementById('btn-delete-budget');
    if (deleteBtn) {
      deleteBtn.style.display = existingBudget ? '' : 'none';
    }

    this.modalEl.classList.add('active');
    setTimeout(() => document.getElementById('budget-limit-amount').focus(), 150);
  }

  closeModal() {
    this.modalEl.classList.remove('active');
    this.activeCategoryId = null;
  }

  handleFormSubmit() {
    const limitAmount = parseFormattedNumber(document.getElementById('budget-limit-amount').value);
    const month = document.getElementById('budget-month').value;

    if (this.activeCategoryId) {
      stateStore.setBudget(this.activeCategoryId, month, limitAmount);
    }

    this.closeModal();
  }
}
