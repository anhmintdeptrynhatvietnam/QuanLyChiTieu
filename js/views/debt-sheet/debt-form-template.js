/**
 * Template Markup for Debt Form
 */
export const DEBT_ACTIONS = [
  { id: 'lend', label: 'Cho vay', desc: 'Tiền xuất ra cho vay, không tính vào Chi tiêu tháng.' },
  { id: 'borrow', label: 'Đi vay', desc: 'Tiền nhận vào khi đi vay mượn, không tính vào Thu nhập tháng.' },
  { id: 'collect', label: 'Thu nợ', desc: 'Thu hồi tiền người khác nợ bạn, không tính vào Thu nhập tháng.' },
  { id: 'repay', label: 'Trả nợ', desc: 'Thanh toán tiền bạn đang nợ người khác, không tính vào Chi tiêu tháng.' }
];

export function getDebtFormHTML({ currentAction }) {
  return `
    <!-- Debt Action Segmented Control -->
    <div class="segmented" role="tablist">
      ${DEBT_ACTIONS.map(a => `
        <button type="button" class="segmented-item${a.id === currentAction ? ' active' : ''}" data-debt-action="${a.id}">
          ${a.label}
        </button>
      `).join('')}
    </div>
    <div id="debt-action-desc" class="sheet-desc-text"></div>

    <!-- Amount Input -->
    <div class="amount-hero-card">
      <span class="amount-label">Số tiền (VNĐ)</span>
      <input type="text" id="debt-amount-input" class="amount-hero-input num" placeholder="0" autocomplete="off" />
      <div id="debt-amount-error" class="sheet-field-error" style="display: none;"></div>
      <div class="quick-chip-row">
        <button type="button" class="chip-sm" data-add="10000">+10k</button>
        <button type="button" class="chip-sm" data-add="50000">+50k</button>
        <button type="button" class="chip-sm" data-add="100000">+100k</button>
        <button type="button" class="chip-sm" data-add="500000">+500k</button>
        <button type="button" class="chip-sm chip-clear" id="btn-debt-amount-clear">C</button>
      </div>
    </div>

    <!-- Person Group (Lend / Borrow) -->
    <div id="debt-person-group" class="form-group">
      <label class="form-label" id="debt-person-label">Người liên quan *</label>
      <input type="text" id="debt-person-name" class="form-input" placeholder="Ví dụ: Bạn Nam, Sếp, Em Lan..." />
      <div id="debt-person-error" class="sheet-field-error" style="display: none;"></div>
    </div>

    <!-- Debt Picker Group (Collect / Repay) -->
    <div id="debt-picker-group" class="form-group" style="display: none;">
      <label class="form-label">Chọn khoản nợ *</label>
      <div id="debt-picker-list" class="debt-picker-list"></div>
      <div id="debt-select-error" class="sheet-field-error" style="display: none;"></div>
    </div>

    <!-- Wallet Picker -->
    <div class="form-group">
      <label class="form-label" id="debt-wallet-label">Ví thực hiện *</label>
      <div id="debt-wallet-slot"></div>
    </div>

    <!-- Optional Due Date (Lend / Borrow) -->
    <div id="debt-due-group" class="form-group">
      <label class="form-label">Ngày hẹn trả (Tùy chọn)</label>
      <input type="date" id="debt-due-date" class="form-input" />
    </div>

    <!-- Note Input -->
    <div class="form-group">
      <label class="form-label">Ghi chú</label>
      <input type="text" id="debt-note" class="form-input" placeholder="Ghi chú thêm..." />
    </div>

    <!-- Submit Button -->
    <div class="sheet-sticky-footer">
      <button type="button" class="btn-v2 btn-v2-primary w-full" id="btn-submit-debt">
        Lưu thông tin Vay / Nợ
      </button>
    </div>
  `;
}
