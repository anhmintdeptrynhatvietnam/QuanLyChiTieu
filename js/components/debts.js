/**
 * Debts & Loans Management Component
 */
import { stateStore } from '../state.js';
import { formatCurrency, formatNumber, parseFormattedNumber, formatDate } from '../utils/formatters.js';
import { escapeHtml } from '../utils/helpers.js';
import { attachModalA11y } from '../utils/modal-a11y.js';
import { isAmountVisible, renderEyeButton, attachPrivacyListeners } from '../utils/privacy.js';
import { confirmDialog } from './confirm-dialog.js';
import { showToast } from './toast.js';

export class Debts {
  constructor(containerId = 'view-debts') {
    this.container = document.getElementById(containerId);
    this.activeFilter = 'all'; // 'all' | 'lend' | 'borrow' | 'unpaid' | 'paid'
    this.selectedDebtId = null;
    this.init();
  }

  init() {
    this.createModals();
    this.render();
    this.bindEvents();
    stateStore.subscribe(() => this.render());
  }

  createModals() {
    // 1. Modal Thêm / Sửa Khoản Nợ
    const debtModalHTML = `
      <div class="modal-overlay" id="debt-modal">
        <div class="modal-content">
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-4);">
            <h3 id="debt-modal-title">Thêm Khoản Vay / Nợ Mới</h3>
            <button type="button" class="btn btn-icon" id="btn-close-debt-modal" aria-label="Đóng">
              <i data-lucide="x" style="width: 18px; height: 18px;"></i>
            </button>
          </div>

          <form id="debt-form">
            <div class="form-group">
              <label class="form-label">Loại giao dịch *</label>
              <select id="debt-type" class="form-select">
                <option value="lend">Cho vay / Mua hộ (Người khác nợ tôi)</option>
                <option value="borrow">Đi vay / Mượn tiền (Tôi nợ người khác)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" id="debt-person-label">Người vay / Đối tác *</label>
              <input type="text" id="debt-person-name" class="form-input" placeholder="Ví dụ: Bạn Nam, Sếp, Em Lan..." required>
            </div>

            <div class="form-group">
              <label class="form-label">Số tiền (VNĐ) *</label>
              <input type="text" id="debt-amount" class="form-input font-bold" placeholder="0" style="font-size: 1.25rem; color: var(--primary-600);" required>
            </div>

            <div class="form-group" id="debt-wallet-group">
              <label class="form-label" id="debt-wallet-label">Ví xuất tiền *</label>
              <select id="debt-wallet" class="form-select" required></select>
            </div>

            <div class="form-group">
              <label class="form-label">Ngày hẹn trả (Tùy chọn)</label>
              <input type="date" id="debt-due-date" class="form-input">
            </div>

            <div class="form-group">
              <label class="form-label">Ghi chú</label>
              <input type="text" id="debt-note" class="form-input" placeholder="Ví dụ: Mua đồ hộ Sếp, Vay tiền ăn cưới...">
            </div>

            <div class="flex gap-3 justify-between" style="margin-top: var(--space-6);">
              <button type="button" class="btn btn-secondary" id="btn-cancel-debt">Hủy</button>
              <button type="submit" class="btn btn-primary" style="flex: 1;">Lưu Khoản Nợ</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // 2. Modal Thu Nợ / Trả Nợ
    const repaymentModalHTML = `
      <div class="modal-overlay" id="repayment-modal">
        <div class="modal-content">
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-4);">
            <h3 id="repayment-modal-title">Ghi Nhận Thu Nợ</h3>
            <button type="button" class="btn btn-icon" id="btn-close-repayment-modal" aria-label="Đóng">
              <i data-lucide="x" style="width: 18px; height: 18px;"></i>
            </button>
          </div>

          <form id="repayment-form">
            <div id="repayment-debt-info" style="margin-bottom: var(--space-4); background: var(--bg-subtle); padding: var(--space-3); border-radius: var(--radius-md);">
              <!-- Rendered dynamically -->
            </div>

            <div class="form-group">
              <label class="form-label">Số tiền trả đợt này (VNĐ) *</label>
              <input type="text" id="repayment-amount" class="form-input font-bold" placeholder="0" style="font-size: 1.25rem; color: var(--income-primary);" required>
              <small class="text-muted" style="display: block; margin-top: 4px;">Có thể trả hết hoặc trả góp một phần.</small>
            </div>

            <div class="form-group">
              <label class="form-label" id="repayment-wallet-label">Ví nhận tiền *</label>
              <select id="repayment-wallet" class="form-select" required></select>
            </div>

            <div class="form-group">
              <label class="form-label">Ngày giao dịch *</label>
              <input type="date" id="repayment-date" class="form-input" required>
            </div>

            <div class="form-group">
              <label class="form-label">Ghi chú thanh toán</label>
              <input type="text" id="repayment-note" class="form-input" placeholder="Ví dụ: Chuyển khoản trả trước đợt 1...">
            </div>

            <div class="flex gap-3 justify-between" style="margin-top: var(--space-6);">
              <button type="button" class="btn btn-secondary" id="btn-cancel-repayment">Hủy</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-repayment" style="flex: 1;">Xác Nhận</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', debtModalHTML);
    document.body.insertAdjacentHTML('beforeend', repaymentModalHTML);

    this.debtModalEl = document.getElementById('debt-modal');
    this.repaymentModalEl = document.getElementById('repayment-modal');

    attachModalA11y(this.debtModalEl, 'debt-modal-title', () => this.closeDebtModal());
    attachModalA11y(this.repaymentModalEl, 'repayment-modal-title', () => this.closeRepaymentModal());
  }

  render() {
    const state = stateStore.getState();
    const debts = state.debts || [];

    // Calculations
    const totalLend = debts.filter(d => d.type === 'lend' && d.status !== 'paid')
      .reduce((acc, d) => acc + (Number(d.remainingAmount) || 0), 0);
    const totalBorrow = debts.filter(d => d.type === 'borrow' && d.status !== 'paid')
      .reduce((acc, d) => acc + (Number(d.remainingAmount) || 0), 0);

    // Filtering
    let filteredDebts = [...debts];
    if (this.activeFilter === 'lend') filteredDebts = filteredDebts.filter(d => d.type === 'lend');
    else if (this.activeFilter === 'borrow') filteredDebts = filteredDebts.filter(d => d.type === 'borrow');
    else if (this.activeFilter === 'unpaid') filteredDebts = filteredDebts.filter(d => d.status !== 'paid');
    else if (this.activeFilter === 'paid') filteredDebts = filteredDebts.filter(d => d.status === 'paid');

    const isLendVisible = isAmountVisible('debts_total_lend');
    const isBorrowVisible = isAmountVisible('debts_total_borrow');

    this.container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Top Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4);">
          <!-- Total Lend (Receivable) -->
          <div class="card" style="border-left: 4px solid var(--income-primary);">
            <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
              <span class="text-secondary font-medium" style="font-size: var(--font-size-sm);">Họ Đang Nợ Tôi (Cần Thu)</span>
              <div class="badge badge-income"><i data-lucide="hand-coins" style="width: 14px; height: 14px;"></i></div>
            </div>
            <div class="flex items-center gap-2" style="margin-bottom: var(--space-1);">
              <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--income-primary); margin: 0;">
                ${isLendVisible ? formatCurrency(totalLend) : '<span class="masked-amount font-bold">••••••••</span>'}
              </h2>
              ${renderEyeButton('debts_total_lend')}
            </div>
            <small class="text-muted">Tiền đã cho vay hoặc mua hộ chưa thu về</small>
          </div>

          <!-- Total Borrow (Payable) -->
          <div class="card" style="border-left: 4px solid var(--expense-primary);">
            <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
              <span class="text-secondary font-medium" style="font-size: var(--font-size-sm);">Tôi Đang Nợ Họ (Cần Trả)</span>
              <div class="badge badge-expense"><i data-lucide="landmark" style="width: 14px; height: 14px;"></i></div>
            </div>
            <div class="flex items-center gap-2" style="margin-bottom: var(--space-1);">
              <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--expense-primary); margin: 0;">
                ${isBorrowVisible ? formatCurrency(totalBorrow) : '<span class="masked-amount font-bold">••••••••</span>'}
              </h2>
              ${renderEyeButton('debts_total_borrow')}
            </div>
            <small class="text-muted">Tiền đang đi vay mượn cần hoàn trả</small>
          </div>
        </div>

        <!-- Action Bar & Filters -->
        <div class="card flex items-center justify-between" style="flex-wrap: wrap; gap: var(--space-4);">
          <!-- Filters -->
          <div class="flex items-center gap-2" style="flex-wrap: wrap;">
            <button type="button" class="chip filter-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">Tất cả (${debts.length})</button>
            <button type="button" class="chip filter-btn ${this.activeFilter === 'lend' ? 'active' : ''}" data-filter="lend">Cho vay</button>
            <button type="button" class="chip filter-btn ${this.activeFilter === 'borrow' ? 'active' : ''}" data-filter="borrow">Đi vay</button>
            <button type="button" class="chip filter-btn ${this.activeFilter === 'unpaid' ? 'active' : ''}" data-filter="unpaid">Chưa xong</button>
            <button type="button" class="chip filter-btn ${this.activeFilter === 'paid' ? 'active' : ''}" data-filter="paid">Đã hoàn tất</button>
          </div>

          <!-- Add Button -->
          <button type="button" class="btn btn-primary" id="btn-open-add-debt">
            <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>
            <span>Tạo Khoản Vay / Nợ</span>
          </button>
        </div>

        <!-- Debts Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-4);">
          ${filteredDebts.length === 0 ? `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: var(--space-10) var(--space-4);">
              <div style="color: var(--text-muted); margin-bottom: var(--space-2);">
                <i data-lucide="receipt-text" style="width: 40px; height: 40px; stroke-width: 1.5;"></i>
              </div>
              <h3 style="font-size: var(--font-size-base); color: var(--text-secondary);">Chưa có khoản vay / nợ nào</h3>
              <small class="text-muted">Bấm "Tạo Khoản Vay / Nợ" để bắt đầu theo dõi các khoản mượn tiền hoặc mua đồ hộ.</small>
            </div>
          ` : filteredDebts.map(d => this.renderDebtCard(d, state)).join('')}
        </div>
      </div>
    `;

    this.bindCardEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  renderDebtCard(debt, state) {
    const isLend = debt.type === 'lend';
    const isPaid = debt.status === 'paid';
    const isPartiallyPaid = debt.status === 'partially_paid';

    const wallet = state.wallets.find(w => w.id === debt.walletId);
    const paidAmount = (Number(debt.amount) || 0) - (Number(debt.remainingAmount) || 0);
    const percent = Math.min(100, Math.round((paidAmount / (Number(debt.amount) || 1)) * 100));

    // Overdue check
    let isOverdue = false;
    if (debt.dueDate && !isPaid) {
      const today = new Date().toISOString().split('T')[0];
      if (debt.dueDate < today) isOverdue = true;
    }

    const typeBadge = isLend
      ? `<span class="badge badge-income"><i data-lucide="circle" style="width: 10px; height: 10px; fill: currentColor;"></i> Cho vay / Mua hộ</span>`
      : `<span class="badge badge-expense"><i data-lucide="circle" style="width: 10px; height: 10px; fill: currentColor;"></i> Đi vay mượn</span>`;

    const statusBadge = isPaid
      ? `<span class="badge badge-income"><i data-lucide="check" style="width: 12px; height: 12px;"></i> Đã hoàn tất</span>`
      : (isPartiallyPaid
          ? `<span class="badge badge-subtle" style="color: var(--primary-600);">Đã trả ${percent}%</span>`
          : `<span class="badge badge-subtle">Chưa trả</span>`);

    return `
      <div class="card flex flex-col justify-between" style="border-top: 4px solid ${isLend ? 'var(--income-primary)' : 'var(--expense-primary)'};">
        <div>
          <!-- Header -->
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-3);">
            <div class="flex items-center gap-2">
              ${typeBadge}
              ${statusBadge}
            </div>
            <div class="flex items-center gap-1">
              <button type="button" class="btn btn-icon btn-edit-debt" data-id="${debt.id}" title="Sửa" aria-label="Sửa khoản nợ">
                <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
              </button>
              <button type="button" class="btn btn-icon btn-delete-debt" data-id="${debt.id}" title="Xóa" aria-label="Xóa khoản nợ" style="color: var(--expense-primary);">
                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
              </button>
            </div>
          </div>

          <!-- Person & Remaining Amount -->
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 2px;">${escapeHtml(debt.personName)}</h3>
          
          <div style="margin: var(--space-3) 0;">
            <span class="text-secondary font-medium" style="font-size: var(--font-size-xs); display: block;">Còn lại cần ${isLend ? 'thu' : 'trả'}:</span>
            <div class="flex items-center gap-2">
              <div class="font-bold ${isPaid ? 'text-muted' : (isLend ? 'text-income' : 'text-expense')}" style="font-size: 1.5rem;">
                ${isAmountVisible(`debt_${debt.id}`) ? formatCurrency(debt.remainingAmount) : '<span class="masked-amount font-bold">••••••••</span>'}
              </div>
              ${renderEyeButton(`debt_${debt.id}`)}
            </div>
            <small class="text-muted" style="font-size: 11px;">Gốc ban đầu: ${isAmountVisible(`debt_${debt.id}`) ? formatCurrency(debt.amount) : '••••••••'} (Ví: ${escapeHtml(wallet?.name || 'Mặc định')})</small>
          </div>

          <!-- Progress Bar -->
          <div style="background: var(--bg-subtle); border-radius: 9999px; height: 6px; overflow: hidden; margin: var(--space-2) 0;">
            <div style="background: ${isPaid ? 'var(--income-primary)' : 'var(--primary-500)'}; width: ${percent}%; height: 100%; transition: width 0.3s ease;"></div>
          </div>

          <!-- Dates & Note -->
          <div style="margin-top: var(--space-3); font-size: var(--font-size-xs);" class="flex flex-col gap-1 text-muted">
            <div class="flex items-center gap-1"><i data-lucide="calendar" style="width: 12px; height: 12px;"></i> Ngày tạo: <strong>${formatDate(debt.createdAt)}</strong></div>
            ${debt.dueDate ? `
              <div class="flex items-center gap-1 ${isOverdue ? 'text-expense font-bold' : ''}">
                <i data-lucide="clock" style="width: 12px; height: 12px;"></i> Hạn trả: <strong>${formatDate(debt.dueDate)}</strong> ${isOverdue ? '(Quá hạn!)' : ''}
              </div>
            ` : ''}
            ${debt.note ? `<div class="flex items-center gap-1" style="font-style: italic; margin-top: 2px;"><i data-lucide="pencil" style="width: 12px; height: 12px; flex-shrink: 0;"></i> "${escapeHtml(debt.note)}"</div>` : ''}
          </div>

          <!-- Repayments History -->
          ${debt.repayments && debt.repayments.length > 0 ? `
            <div style="margin-top: var(--space-3); border-top: 1px dashed var(--border-subtle); padding-top: var(--space-2);">
              <small class="font-semibold text-secondary" style="font-size: 11px; display: block; margin-bottom: 4px;">Lịch sử thanh toán (${debt.repayments.length} lần):</small>
              <div class="flex flex-col gap-1">
                ${debt.repayments.map(r => `
                  <div class="flex items-center justify-between text-muted" style="font-size: 11px; background: var(--bg-subtle); padding: 3px 6px; border-radius: var(--radius-sm);">
                    <span>${formatDate(r.date)} ${r.note ? `(${escapeHtml(r.note)})` : ''}</span>
                    <strong class="text-primary">+${formatCurrency(r.amount)}</strong>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Action Button -->
        <div style="margin-top: var(--space-4); border-top: 1px solid var(--border-subtle); padding-top: var(--space-3);">
          ${!isPaid ? `
            <button type="button" class="btn ${isLend ? 'btn-primary' : 'btn-secondary'} w-full btn-open-repay" data-id="${debt.id}" style="justify-content: center;">
              <i data-lucide="${isLend ? 'download' : 'upload'}" style="width: 14px; height: 14px;"></i>
              <span>${isLend ? 'Thu Nợ Đợt Này' : 'Trả Nợ Đợt Này'}</span>
            </button>
          ` : `
            <div class="flex items-center justify-center gap-1" style="font-size: 12px; color: var(--income-primary); font-weight: 600; padding: 4px 0;">
              <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Khoản nợ đã thanh toán xong
            </div>
          `}
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 1. Debt Modal events
    const closeDebtBtn = document.getElementById('btn-close-debt-modal');
    const cancelDebtBtn = document.getElementById('btn-cancel-debt');
    const debtForm = document.getElementById('debt-form');
    const debtAmountInput = document.getElementById('debt-amount');
    const debtTypeSelect = document.getElementById('debt-type');

    closeDebtBtn.addEventListener('click', () => this.closeDebtModal());
    cancelDebtBtn.addEventListener('click', () => this.closeDebtModal());
    this.debtModalEl.addEventListener('click', (e) => {
      if (e.target === this.debtModalEl) this.closeDebtModal();
    });

    debtTypeSelect.addEventListener('change', () => this.updateDebtFormLabels());

    debtAmountInput.addEventListener('input', (e) => {
      const clean = String(e.target.value).replace(/\D/g, '');
      if (!clean) { e.target.value = ''; return; }
      e.target.value = formatNumber(parseFormattedNumber(clean));
    });

    debtForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleDebtSubmit();
    });

    // 2. Repayment Modal events
    const closeRepayBtn = document.getElementById('btn-close-repayment-modal');
    const cancelRepayBtn = document.getElementById('btn-cancel-repayment');
    const repayForm = document.getElementById('repayment-form');
    const repayAmountInput = document.getElementById('repayment-amount');

    closeRepayBtn.addEventListener('click', () => this.closeRepaymentModal());
    cancelRepayBtn.addEventListener('click', () => this.closeRepaymentModal());
    this.repaymentModalEl.addEventListener('click', (e) => {
      if (e.target === this.repaymentModalEl) this.closeRepaymentModal();
    });

    repayAmountInput.addEventListener('input', (e) => {
      const clean = String(e.target.value).replace(/\D/g, '');
      if (!clean) { e.target.value = ''; return; }
      e.target.value = formatNumber(parseFormattedNumber(clean));
    });

    repayForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRepaymentSubmit();
    });
  }

  bindCardEvents() {
    // Open add modal
    const addBtn = this.container.querySelector('#btn-open-add-debt');
    if (addBtn) addBtn.addEventListener('click', () => this.openDebtModal());

    // Filters
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilter = btn.getAttribute('data-filter');
        this.render();
      });
    });

    // Edit & Delete
    this.container.querySelectorAll('.btn-edit-debt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openDebtModal(id);
      });
    });

    this.container.querySelectorAll('.btn-delete-debt').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const confirmed = await confirmDialog('Bạn có chắc chắn muốn xóa khoản nợ này? Số dư ví sẽ được hoàn lại.', { danger: true });
        if (confirmed) {
          stateStore.deleteDebt(id);
        }
      });
    });

    // Repay action
    this.container.querySelectorAll('.btn-open-repay').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openRepaymentModal(id);
      });
    });

    // Attach privacy toggle listeners for eye buttons
    attachPrivacyListeners(this.container, () => this.render());
  }

  populateWalletSelect(selectId, selectedWalletId = null) {
    const state = stateStore.getState();
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = state.wallets.map(w => {
      const isCredit = w.type === 'credit';
      const bal = isCredit && w.currentBalance < 0 
        ? `Nợ ${formatNumber(Math.abs(w.currentBalance))} ₫` 
        : `${formatNumber(w.currentBalance)} ₫`;
      return `<option value="${w.id}" ${w.id === selectedWalletId ? 'selected' : ''}>${escapeHtml(w.name)} (${bal})</option>`;
    }).join('');
  }

  updateDebtFormLabels() {
    const type = document.getElementById('debt-type').value;
    const personLabel = document.getElementById('debt-person-label');
    const walletLabel = document.getElementById('debt-wallet-label');

    if (type === 'lend') {
      personLabel.textContent = 'Người vay tiền / Người bạn mua đồ hộ *';
      walletLabel.textContent = 'Ví xuất tiền cho vay *';
    } else {
      personLabel.textContent = 'Người cho bạn vay tiền *';
      walletLabel.textContent = 'Ví nhận tiền vay *';
    }
  }

  openDebtModal(debtId = null) {
    this.selectedDebtId = debtId;
    const titleEl = document.getElementById('debt-modal-title');
    const typeSelect = document.getElementById('debt-type');
    const personInput = document.getElementById('debt-person-name');
    const amountInput = document.getElementById('debt-amount');
    const walletGroup = document.getElementById('debt-wallet-group');
    const dueDateInput = document.getElementById('debt-due-date');
    const noteInput = document.getElementById('debt-note');

    if (debtId) {
      const state = stateStore.getState();
      const debt = state.debts.find(d => d.id === debtId);
      if (!debt) return;

      titleEl.textContent = 'Chỉnh Sửa Khoản Vay / Nợ';
      typeSelect.value = debt.type;
      typeSelect.disabled = true;
      personInput.value = debt.personName;
      amountInput.value = formatNumber(debt.amount);
      amountInput.disabled = true; // prevent changing initial principal directly
      walletGroup.classList.add('hidden');
      dueDateInput.value = debt.dueDate || '';
      noteInput.value = debt.note || '';
    } else {
      titleEl.textContent = 'Thêm Khoản Vay / Nợ Mới';
      typeSelect.value = 'lend';
      typeSelect.disabled = false;
      personInput.value = '';
      amountInput.value = '';
      amountInput.disabled = false;
      walletGroup.classList.remove('hidden');
      this.populateWalletSelect('debt-wallet');
      dueDateInput.value = '';
      noteInput.value = '';
    }

    this.updateDebtFormLabels();
    this.debtModalEl.classList.add('active');
    setTimeout(() => personInput.focus(), 150);
  }

  closeDebtModal() {
    this.debtModalEl.classList.remove('active');
    this.selectedDebtId = null;
  }

  handleDebtSubmit() {
    const personName = document.getElementById('debt-person-name').value.trim();
    const type = document.getElementById('debt-type').value;
    const amount = parseFormattedNumber(document.getElementById('debt-amount').value);
    const walletId = document.getElementById('debt-wallet').value;
    const dueDate = document.getElementById('debt-due-date').value || null;
    const note = document.getElementById('debt-note').value.trim();

    if (!personName) {
      showToast('Vui lòng nhập tên người liên quan', 'error');
      return;
    }

    if (this.selectedDebtId) {
      stateStore.updateDebt(this.selectedDebtId, { personName, dueDate, note });
    } else {
      if (amount <= 0) {
        showToast('Vui lòng nhập số tiền hợp lệ lớn hơn 0', 'error');
        return;
      }
      stateStore.addDebt({ personName, type, amount, walletId, dueDate, note });
    }

    this.closeDebtModal();
  }

  openRepaymentModal(debtId) {
    this.selectedDebtId = debtId;
    const state = stateStore.getState();
    const debt = state.debts.find(d => d.id === debtId);
    if (!debt) return;

    const isLend = debt.type === 'lend';
    const titleEl = document.getElementById('repayment-modal-title');
    const infoEl = document.getElementById('repayment-debt-info');
    const amountInput = document.getElementById('repayment-amount');
    const walletLabel = document.getElementById('repayment-wallet-label');
    const dateInput = document.getElementById('repayment-date');
    const noteInput = document.getElementById('repayment-note');
    const submitBtn = document.getElementById('btn-submit-repayment');

    titleEl.textContent = isLend ? `Thu Nợ: ${debt.personName}` : `Trả Nợ: ${debt.personName}`;
    walletLabel.textContent = isLend ? 'Ví nhận tiền thu nợ *' : 'Ví thanh toán tiền trả nợ *';
    submitBtn.textContent = isLend ? 'Xác Nhận Thu Nợ' : 'Xác Nhận Trả Nợ';

    infoEl.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <span class="text-secondary font-medium" style="font-size: 12px;">Khoản nợ: <strong>${escapeHtml(debt.personName)}</strong></span>
          <div class="text-muted" style="font-size: 11px;">Gốc: ${formatCurrency(debt.amount)}</div>
        </div>
        <div style="text-align: right;">
          <span class="text-secondary font-medium" style="font-size: 12px;">Còn nợ lại:</span>
          <div class="font-bold ${isLend ? 'text-income' : 'text-expense'}" style="font-size: 1.125rem;">
            ${formatCurrency(debt.remainingAmount)}
          </div>
        </div>
      </div>
    `;

    amountInput.value = formatNumber(debt.remainingAmount);
    this.populateWalletSelect('repayment-wallet', debt.walletId);
    dateInput.value = new Date().toISOString().split('T')[0];
    noteInput.value = '';

    this.repaymentModalEl.classList.add('active');
    setTimeout(() => amountInput.focus(), 150);
  }

  closeRepaymentModal() {
    this.repaymentModalEl.classList.remove('active');
    this.selectedDebtId = null;
  }

  handleRepaymentSubmit() {
    if (!this.selectedDebtId) return;

    const amount = parseFormattedNumber(document.getElementById('repayment-amount').value);
    const walletId = document.getElementById('repayment-wallet').value;
    const date = document.getElementById('repayment-date').value;
    const note = document.getElementById('repayment-note').value.trim();

    if (amount <= 0) {
      showToast('Vui lòng nhập số tiền thanh toán lớn hơn 0', 'error');
      return;
    }

    stateStore.recordRepayment(this.selectedDebtId, { amount, walletId, date, note });
    this.closeRepaymentModal();
  }
}
