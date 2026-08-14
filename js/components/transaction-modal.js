/**
 * Transaction Modal Component (Add / Edit / Transfer)
 */
import { stateStore } from '../state.js';
import { formatNumber, parseFormattedNumber } from '../utils/formatters.js';
import { getCurrentDateFormatted, escapeHtml } from '../utils/helpers.js';

export class TransactionModal {
  constructor() {
    this.modalEl = null;
    this.currentTxId = null;
    this.activeType = 'expense'; // 'expense' | 'income' | 'transfer'
    this.init();
  }

  init() {
    this.createModalDOM();
    this.bindEvents();
  }

  createModalDOM() {
    const modalHTML = `
      <div id="transaction-modal" class="modal-overlay">
        <div class="modal-content">
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-4);">
            <h3 id="tx-modal-title">Ghi Chép Giao Dịch</h3>
            <button type="button" class="btn btn-icon" id="btn-close-tx-modal">
              <i data-lucide="x" style="width: 18px; height: 18px;"></i>
            </button>
          </div>

          <!-- Type Tabs -->
          <div class="flex gap-1" style="margin-bottom: var(--space-4); background: var(--bg-subtle); padding: 4px; border-radius: var(--radius-lg); overflow-x: auto;">
            <button type="button" class="btn w-full tx-type-btn active" data-type="expense" style="padding: 7px 4px; font-size: 13px;">💸 Chi Tiêu</button>
            <button type="button" class="btn w-full tx-type-btn" data-type="income" style="padding: 7px 4px; font-size: 13px;">💰 Thu Nhập</button>
            <button type="button" class="btn w-full tx-type-btn" data-type="transfer" style="padding: 7px 4px; font-size: 13px;">🔄 Chuyển Tiền</button>
            <button type="button" class="btn w-full tx-type-btn" data-type="debt" style="padding: 7px 4px; font-size: 13px;">🤝 Vay / Nợ</button>
          </div>

          <!-- Debt Sub-type Selector (Visible only when type === 'debt') -->
          <div id="tx-debt-actions" class="hidden" style="margin-bottom: var(--space-4); background: rgba(59, 130, 246, 0.08); padding: var(--space-2); border-radius: var(--radius-md);">
            <div class="flex gap-1" style="flex-wrap: wrap;">
              <button type="button" class="badge debt-action-btn badge-primary" data-debt-action="lend" style="padding: 5px 8px; cursor: pointer;">🔵 Cho vay / Mua hộ</button>
              <button type="button" class="badge debt-action-btn badge-subtle" data-debt-action="collect" style="padding: 5px 8px; cursor: pointer;">🟢 Thu nợ</button>
              <button type="button" class="badge debt-action-btn badge-subtle" data-debt-action="borrow" style="padding: 5px 8px; cursor: pointer;">🟠 Đi vay</button>
              <button type="button" class="badge debt-action-btn badge-subtle" data-debt-action="repay" style="padding: 5px 8px; cursor: pointer;">🔴 Trả nợ</button>
            </div>
            <small id="tx-debt-desc" class="text-muted" style="display: block; margin-top: 4px; font-size: 11px;">
              Tiền xuất ra cho vay, không tính vào Chi tiêu tháng.
            </small>
          </div>

          <form id="tx-form">
            <!-- Amount Input -->
            <div class="form-group">
              <label class="form-label">Số tiền (VNĐ) *</label>
              <input type="text" id="tx-amount" class="form-input font-bold" placeholder="0" style="font-size: 1.35rem; color: var(--primary-600);" required>
              <div class="flex gap-2" style="margin-top: 6px; flex-wrap: wrap;">
                <button type="button" class="badge badge-subtle chip-add" data-add="50000">+50k</button>
                <button type="button" class="badge badge-subtle chip-add" data-add="100000">+100k</button>
                <button type="button" class="badge badge-subtle chip-add" data-add="500000">+500k</button>
                <button type="button" class="badge badge-subtle chip-add" data-add="1000000">+1Tr</button>
              </div>
            </div>

            <!-- Debt Target / Existing Debt Selector -->
            <div class="form-group hidden" id="tx-debt-person-group">
              <label class="form-label" id="tx-debt-person-label">Người vay / Đối tác *</label>
              <input type="text" id="tx-debt-person-name" class="form-input" placeholder="Ví dụ: Bạn Nam, Sếp, Em Lan...">
            </div>

            <div class="form-group hidden" id="tx-debt-select-group">
              <label class="form-label" id="tx-debt-select-label">Chọn khoản nợ cần thanh toán *</label>
              <select id="tx-debt-select" class="form-select"></select>
            </div>

            <!-- Category Field (For Expense/Income) -->
            <div class="form-group" id="tx-category-group">
              <div class="flex items-center justify-between" style="margin-bottom: var(--space-1);">
                <label class="form-label" style="margin-bottom: 0;">Hạng mục *</label>
                <button type="button" class="btn btn-secondary" id="btn-quick-add-cat" style="padding: 2px 8px; font-size: 11px; height: auto;">
                  <i data-lucide="plus" style="width: 12px; height: 12px;"></i>
                  <span>+ Tạo mới</span>
                </button>
              </div>
              <select id="tx-category" class="form-select"></select>
            </div>

            <!-- Wallets Field -->
            <div class="form-group" id="tx-wallet-group">
              <label class="form-label" id="tx-wallet-label">Tài khoản / Ví nguồn *</label>
              <select id="tx-wallet" class="form-select" required></select>
            </div>

            <!-- Destination Wallet (For Transfer) -->
            <div class="form-group hidden" id="tx-to-wallet-group">
              <label class="form-label">Chuyển đến Ví *</label>
              <select id="tx-to-wallet" class="form-select"></select>
            </div>

            <!-- Date Field -->
            <div class="form-group">
              <label class="form-label">Ngày giao dịch</label>
              <input type="date" id="tx-date" class="form-input" required>
            </div>

            <!-- Due Date Field (For Debt) -->
            <div class="form-group hidden" id="tx-debt-due-group">
              <label class="form-label">Ngày hẹn trả (Tùy chọn)</label>
              <input type="date" id="tx-debt-due-date" class="form-input">
            </div>

            <!-- Note Field -->
            <div class="form-group">
              <label class="form-label">Ghi chú</label>
              <input type="text" id="tx-note" class="form-input" placeholder="Ví dụ: Ăn trưa với đồng nghiệp, Mua đồ siêu thị...">
            </div>

            <!-- Form Actions -->
            <div class="flex gap-3 justify-between" style="margin-top: var(--space-6);">
              <button type="button" class="btn btn-secondary" id="btn-cancel-tx">Hủy</button>
              <button type="submit" class="btn btn-primary" style="flex: 1;">Lưu Giao Dịch</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalEl = document.getElementById('transaction-modal');
  }

  bindEvents() {
    const closeBtn = document.getElementById('btn-close-tx-modal');
    const cancelBtn = document.getElementById('btn-cancel-tx');
    const form = document.getElementById('tx-form');
    const amountInput = document.getElementById('tx-amount');
    const quickAddCatBtn = document.getElementById('btn-quick-add-cat');

    closeBtn.addEventListener('click', () => this.close());
    cancelBtn.addEventListener('click', () => this.close());

    // Click outside backdrop to close
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    // Quick add new category
    if (quickAddCatBtn) {
      quickAddCatBtn.addEventListener('click', () => {
        const typeName = this.activeType === 'income' ? 'thu nhập' : 'chi tiêu';
        const name = prompt(`Nhập tên loại ${typeName} mới (Ví dụ: Thể thao, Tiền điện nước, Học phí...):`);
        if (name && name.trim()) {
          const newCat = stateStore.addCategory({
            name: name.trim(),
            type: this.activeType
          });
          this.updateFormFields();
          document.getElementById('tx-category').value = newCat.id;
        }
      });
    }

    // Type tab switching
    const typeButtons = this.modalEl.querySelectorAll('.tx-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active', 'btn-primary'));
        btn.classList.add('active', 'btn-primary');
        this.activeType = btn.getAttribute('data-type');
        this.updateFormFields();
      });
    });

    // Debt action switching
    this.debtAction = 'lend';
    const debtActionBtns = this.modalEl.querySelectorAll('.debt-action-btn');
    debtActionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        debtActionBtns.forEach(b => {
          b.classList.remove('badge-primary');
          b.classList.add('badge-subtle');
        });
        btn.classList.remove('badge-subtle');
        btn.classList.add('badge-primary');
        this.debtAction = btn.getAttribute('data-debt-action');
        this.updateDebtFields();
      });
    });

    // Auto format amount input as user types
    amountInput.addEventListener('input', (e) => {
      const clean = String(e.target.value).replace(/\D/g, '');
      if (!clean) {
        e.target.value = '';
        return;
      }
      const raw = parseFormattedNumber(clean);
      e.target.value = raw > 0 ? formatNumber(raw) : '';
    });

    // Quick add chips
    this.modalEl.querySelectorAll('.chip-add').forEach(chip => {
      chip.addEventListener('click', () => {
        const addValue = Number(chip.getAttribute('data-add')) || 0;
        const current = parseFormattedNumber(amountInput.value);
        amountInput.value = formatNumber(current + addValue);
      });
    });

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  updateDebtFields() {
    const state = stateStore.getState();
    const descEl = document.getElementById('tx-debt-desc');
    const personGroup = document.getElementById('tx-debt-person-group');
    const personLabel = document.getElementById('tx-debt-person-label');
    const selectGroup = document.getElementById('tx-debt-select-group');
    const selectLabel = document.getElementById('tx-debt-select-label');
    const debtSelect = document.getElementById('tx-debt-select');
    const dueGroup = document.getElementById('tx-debt-due-group');
    const walletLabel = document.getElementById('tx-wallet-label');
    const amountInput = document.getElementById('tx-amount');

    if (this.debtAction === 'lend') {
      descEl.textContent = 'Tiền xuất ra cho vay/mua hộ, không tính vào Chi tiêu tháng.';
      personGroup.classList.remove('hidden');
      personLabel.textContent = 'Người vay tiền / Người bạn mua đồ hộ *';
      selectGroup.classList.add('hidden');
      dueGroup.classList.remove('hidden');
      walletLabel.textContent = 'Ví xuất tiền cho vay *';
    } else if (this.debtAction === 'borrow') {
      descEl.textContent = 'Tiền nhận vào khi đi vay mượn, không tính vào Thu nhập tháng.';
      personGroup.classList.remove('hidden');
      personLabel.textContent = 'Người cho bạn vay tiền *';
      selectGroup.classList.add('hidden');
      dueGroup.classList.remove('hidden');
      walletLabel.textContent = 'Ví nhận tiền vay *';
    } else if (this.debtAction === 'collect') {
      descEl.textContent = 'Thu hồi tiền người khác nợ bạn, không tính vào Thu nhập tháng.';
      personGroup.classList.add('hidden');
      selectGroup.classList.remove('hidden');
      selectLabel.textContent = 'Chọn khoản nợ cần thu *';
      dueGroup.classList.add('hidden');
      walletLabel.textContent = 'Ví nhận tiền thu nợ *';

      // Populate unpaid lend debts
      const lendDebts = (state.debts || []).filter(d => d.type === 'lend' && d.status !== 'paid');
      if (lendDebts.length === 0) {
        debtSelect.innerHTML = '<option value="">(Không có ai đang nợ bạn)</option>';
      } else {
        debtSelect.innerHTML = lendDebts.map(d => 
          `<option value="${d.id}" data-rem="${d.remainingAmount}">${escapeHtml(d.personName)} (Còn nợ: ${formatNumber(d.remainingAmount)} ₫)</option>`
        ).join('');
        if (lendDebts[0] && !amountInput.value) {
          amountInput.value = formatNumber(lendDebts[0].remainingAmount);
        }
      }
    } else if (this.debtAction === 'repay') {
      descEl.textContent = 'Thanh toán tiền bạn đang nợ người khác, không tính vào Chi tiêu tháng.';
      personGroup.classList.add('hidden');
      selectGroup.classList.remove('hidden');
      selectLabel.textContent = 'Chọn khoản nợ cần trả *';
      dueGroup.classList.add('hidden');
      walletLabel.textContent = 'Ví thanh toán tiền trả nợ *';

      // Populate unpaid borrow debts
      const borrowDebts = (state.debts || []).filter(d => d.type === 'borrow' && d.status !== 'paid');
      if (borrowDebts.length === 0) {
        debtSelect.innerHTML = '<option value="">(Bạn không có khoản nợ nào cần trả)</option>';
      } else {
        debtSelect.innerHTML = borrowDebts.map(d => 
          `<option value="${d.id}" data-rem="${d.remainingAmount}">${escapeHtml(d.personName)} (Còn nợ: ${formatNumber(d.remainingAmount)} ₫)</option>`
        ).join('');
        if (borrowDebts[0] && !amountInput.value) {
          amountInput.value = formatNumber(borrowDebts[0].remainingAmount);
        }
      }
    }
  }

  updateFormFields() {
    const state = stateStore.getState();
    const catGroup = document.getElementById('tx-category-group');
    const toWalletGroup = document.getElementById('tx-to-wallet-group');
    const debtActions = document.getElementById('tx-debt-actions');
    const personGroup = document.getElementById('tx-debt-person-group');
    const selectGroup = document.getElementById('tx-debt-select-group');
    const dueGroup = document.getElementById('tx-debt-due-group');
    const catSelect = document.getElementById('tx-category');
    const walletSelect = document.getElementById('tx-wallet');
    const toWalletSelect = document.getElementById('tx-to-wallet');

    // Populate Wallets
    const walletOptions = state.wallets.map(w => {
      const isCredit = w.type === 'credit';
      let balText = `${formatNumber(w.currentBalance)} ₫`;
      if (isCredit) {
        balText = w.currentBalance < 0 ? `Thẻ TD - Nợ ${formatNumber(Math.abs(w.currentBalance))} ₫` : `Thẻ TD - ${formatNumber(w.currentBalance)} ₫`;
      }
      return `<option value="${w.id}">${escapeHtml(w.name)} (${balText})</option>`;
    }).join('');
    walletSelect.innerHTML = walletOptions;
    toWalletSelect.innerHTML = walletOptions;

    if (this.activeType === 'transfer') {
      catGroup.classList.add('hidden');
      toWalletGroup.classList.remove('hidden');
      debtActions.classList.add('hidden');
      personGroup.classList.add('hidden');
      selectGroup.classList.add('hidden');
      dueGroup.classList.add('hidden');
      document.getElementById('tx-wallet-label').textContent = 'Từ Ví nguồn *';
    } else if (this.activeType === 'debt') {
      catGroup.classList.add('hidden');
      toWalletGroup.classList.add('hidden');
      debtActions.classList.remove('hidden');
      this.updateDebtFields();
    } else {
      catGroup.classList.remove('hidden');
      toWalletGroup.classList.add('hidden');
      debtActions.classList.add('hidden');
      personGroup.classList.add('hidden');
      selectGroup.classList.add('hidden');
      dueGroup.classList.add('hidden');
      document.getElementById('tx-wallet-label').textContent = 'Ví thanh toán *';

      // Filter categories by type
      const filteredCategories = state.categories.filter(c => c.type === this.activeType);
      catSelect.innerHTML = filteredCategories.map(c => 
        `<option value="${c.id}">${escapeHtml(c.name)}</option>`
      ).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  open(txId = null) {
    this.currentTxId = txId;
    const state = stateStore.getState();
    const titleEl = document.getElementById('tx-modal-title');
    const dateInput = document.getElementById('tx-date');
    const amountInput = document.getElementById('tx-amount');
    const noteInput = document.getElementById('tx-note');

    if (txId) {
      const tx = state.transactions.find(t => t.id === txId);
      if (!tx) return;
      titleEl.textContent = 'Chỉnh Sửa Giao Dịch';
      this.activeType = tx.type;
      amountInput.value = formatNumber(tx.amount);
      dateInput.value = tx.date;
      noteInput.value = tx.note || '';

      this.updateTypeTabs();
      this.updateFormFields();

      if (tx.categoryId) document.getElementById('tx-category').value = tx.categoryId;
      if (tx.walletId) document.getElementById('tx-wallet').value = tx.walletId;
      if (tx.toWalletId) document.getElementById('tx-to-wallet').value = tx.toWalletId;
    } else {
      titleEl.textContent = 'Ghi Chép Giao Dịch';
      this.activeType = 'expense';
      amountInput.value = '';
      dateInput.value = getCurrentDateFormatted();
      noteInput.value = '';
      this.updateTypeTabs();
      this.updateFormFields();
    }

    this.modalEl.classList.add('active');
    setTimeout(() => amountInput.focus(), 150);
  }

  updateTypeTabs() {
    const typeButtons = this.modalEl.querySelectorAll('.tx-type-btn');
    typeButtons.forEach(btn => {
      const isSelected = btn.getAttribute('data-type') === this.activeType;
      btn.classList.toggle('active', isSelected);
      btn.classList.toggle('btn-primary', isSelected);
    });
  }

  close() {
    this.modalEl.classList.remove('active');
    this.currentTxId = null;
  }

  handleSubmit() {
    const amount = parseFormattedNumber(document.getElementById('tx-amount').value);
    if (amount <= 0) {
      alert('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

    const walletId = document.getElementById('tx-wallet').value;
    const date = document.getElementById('tx-date').value;
    const note = document.getElementById('tx-note').value.trim();

    // Handling Debt Mode
    if (this.activeType === 'debt') {
      if (this.debtAction === 'lend' || this.debtAction === 'borrow') {
        const personName = document.getElementById('tx-debt-person-name').value.trim();
        if (!personName) {
          alert('Vui lòng nhập tên người vay / cho vay');
          return;
        }
        const dueDate = document.getElementById('tx-debt-due-date').value || null;
        stateStore.addDebt({
          personName,
          type: this.debtAction,
          amount,
          walletId,
          dueDate,
          note
        });
      } else {
        // collect or repay
        const selectedDebtId = document.getElementById('tx-debt-select').value;
        if (!selectedDebtId) {
          alert('Vui lòng chọn khoản nợ cần thanh toán');
          return;
        }
        stateStore.recordRepayment(selectedDebtId, {
          amount,
          walletId,
          date,
          note
        });
      }
      this.close();
      return;
    }

    // Standard Transaction Mode
    const toWalletId = this.activeType === 'transfer' ? document.getElementById('tx-to-wallet').value : null;

    if (this.activeType === 'transfer' && walletId === toWalletId) {
      alert('Ví nhận tiền phải khác Ví nguồn');
      return;
    }

    const txData = {
      type: this.activeType,
      amount,
      walletId,
      toWalletId,
      categoryId: this.activeType !== 'transfer' ? document.getElementById('tx-category').value : '',
      date,
      note
    };

    if (this.currentTxId) {
      stateStore.updateTransaction(this.currentTxId, txData);
    } else {
      stateStore.addTransaction(txData);
    }

    this.close();
  }
}
