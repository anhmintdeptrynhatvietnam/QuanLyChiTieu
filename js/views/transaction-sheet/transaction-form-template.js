/**
 * Template Markup for Transaction Form
 */
import { escapeHtml } from '../../utils/helpers.js';

export function getTransactionFormHTML({ currentType, currentDate, isEdit, existingTx }) {
  return `
    <!-- Top Type Segmented Control -->
    <div class="segmented" role="tablist" id="tx-type-segmented">
      <button type="button" class="segmented-item${currentType === 'expense' ? ' active' : ''}" data-type="expense">
        <i data-lucide="arrow-up-right" style="width: 16px; height: 16px;"></i>
        <span>Chi tiêu</span>
      </button>
      <button type="button" class="segmented-item${currentType === 'income' ? ' active' : ''}" data-type="income">
        <i data-lucide="arrow-down-left" style="width: 16px; height: 16px;"></i>
        <span>Thu nhập</span>
      </button>
      <button type="button" class="segmented-item${currentType === 'transfer' ? ' active' : ''}" data-type="transfer">
        <i data-lucide="arrow-left-right" style="width: 16px; height: 16px;"></i>
        <span>Chuyển</span>
      </button>
      ${!isEdit ? `
        <button type="button" class="segmented-item${currentType === 'debt' ? ' active' : ''}" data-type="debt">
          <i data-lucide="handshake" style="width: 16px; height: 16px;"></i>
          <span>Vay/Nợ</span>
        </button>
      ` : ''}
    </div>

    <div id="tx-standard-body" class="flex flex-col gap-4">
      <!-- Big Centered Amount Input -->
      <div class="amount-hero-card">
        <span class="amount-label">Số tiền (VNĐ)</span>
        <input type="text" id="tx-amount-hero" class="amount-hero-input num" placeholder="0" autocomplete="off" />
        <div id="tx-amount-error" class="sheet-field-error" style="display: none;"></div>
        <div class="quick-chip-row">
          <button type="button" class="chip-sm" data-add="10000">+10k</button>
          <button type="button" class="chip-sm" data-add="50000">+50k</button>
          <button type="button" class="chip-sm" data-add="100000">+100k</button>
          <button type="button" class="chip-sm" data-add="500000">+500k</button>
          <button type="button" class="chip-sm chip-clear" id="btn-tx-amount-clear">C</button>
        </div>
      </div>

      <!-- Wallet Slot (one row, so it sits above the taller category grid) -->
      <div id="tx-wallet-section" class="form-group">
        <label class="form-label" id="tx-wallet-label">Tài khoản / Ví *</label>
        <div id="tx-wallet-picker-slot"></div>
        <div id="tx-wallet-error" class="sheet-field-error" style="display: none;"></div>
      </div>

      <!-- Transfer Destination Slot (Chuyển) -->
      <div id="tx-to-wallet-section" class="form-group" style="display: none;">
        <label class="form-label">Chuyển đến ví *</label>
        <div id="tx-to-wallet-picker-slot"></div>
        <div id="tx-to-wallet-error" class="sheet-field-error" style="display: none;"></div>
      </div>

      <!-- Category Slot (Chi/Thu): compact, most-used first, collapsed to two rows -->
      <div id="tx-category-section" class="form-group">
        <label class="form-label">Hạng mục *</label>
        <div id="tx-category-grid-slot"></div>
        <div id="tx-category-error" class="sheet-field-error" style="display: none;"></div>
      </div>

      <!-- Date Section -->
      <div class="form-group">
        <div class="flex items-center justify-between" style="margin-bottom: var(--space-1);">
          <label class="form-label" style="margin: 0;">Ngày giao dịch</label>
          <div class="chip-group" style="padding: 0;">
            <button type="button" class="chip-sm" id="btn-date-today">Hôm nay</button>
            <button type="button" class="chip-sm" id="btn-date-yesterday">Hôm qua</button>
          </div>
        </div>
        <input type="date" id="tx-date-input" class="form-input" value="${escapeHtml(currentDate)}" />
      </div>

      <!-- Note Section (Collapsible) -->
      <div class="form-group">
        <button type="button" class="btn-text-toggle" id="btn-toggle-note">
          <i data-lucide="${existingTx?.note ? 'chevron-down' : 'plus'}" style="width: 14px; height: 14px;"></i>
          <span>${existingTx?.note ? 'Ghi chú' : '+ Thêm ghi chú'}</span>
        </button>
        <div id="tx-note-wrapper" style="${existingTx?.note ? 'display: block;' : 'display: none;'} margin-top: 6px;">
          <input type="text" id="tx-note-input" class="form-input" placeholder="Ví dụ: Ăn trưa, Mua đồ siêu thị..." value="${escapeHtml(existingTx?.note || '')}" />
        </div>
      </div>

      <!-- Sticky Bottom Action Bar -->
      <div class="sheet-sticky-footer">
        <div class="flex gap-2 w-full">
          ${isEdit ? `<button type="button" class="btn-v2 btn-v2-danger" id="btn-delete-tx">Xóa</button>` : ''}
          <button type="button" class="btn-v2 btn-v2-primary flex-1 btn-save-tx" id="btn-save-tx">Lưu giao dịch</button>
        </div>
      </div>
    </div>

    <!-- Debt Embed Slot (Vay/Nợ) -->
    <div id="tx-debt-slot" style="display: none;"></div>
  `;
}
