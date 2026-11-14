/**
 * Bottom sheet form for Adding / Editing Wallets
 */
import { openSheet } from '../../ui/bottom-sheet.js';
import { stateStore } from '../../state.js';
import { formatNumber } from '../../utils/formatters.js';
import { escapeHtml, safeColor } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';
import { attachCurrencyInput, getCurrencyValue } from '../../ui/currency-input.js';
import { mountActualBalanceField } from './wallet-actual-balance.js';

const WALLET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export function openWalletSheet({ walletId = null, onDone = null } = {}) {
  let sheet;
  const isEdit = Boolean(walletId);
  const state = stateStore.getState();
  const existingWallet = isEdit ? state.wallets.find(w => w.id === walletId) : null;

  const content = document.createElement('div');
  content.className = 'wallet-form-container';

  let selectedColor = existingWallet?.color || WALLET_COLORS[0];
  const initialBal = existingWallet ? (Number(existingWallet.initialBalance) || 0) : 0;

  content.innerHTML = `
    <form id="wallet-sheet-form" class="flex flex-col gap-4">
      <div class="form-group">
        <label class="form-label" for="ws-wallet-name">Tên Ví / Tài khoản *</label>
        <input type="text" id="ws-wallet-name" class="form-input" placeholder="Ví dụ: MB Bank, Tiền mặt, Tiết kiệm..." required />
      </div>

      <div class="form-group">
        <label class="form-label" for="ws-wallet-type">Loại Ví</label>
        <select id="ws-wallet-type" class="form-select">
          <option value="cash">Tiền mặt (Cash)</option>
          <option value="bank">Tài khoản Ngân hàng (Bank)</option>
          <option value="credit">Thẻ tín dụng (Credit Card - Tiêu trước trả sau)</option>
          <option value="saving">Sổ tiết kiệm (Saving)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" id="ws-balance-label" for="ws-wallet-initial">Số dư ban đầu (VNĐ) *</label>
        <input type="text" id="ws-wallet-initial" class="form-input font-bold" placeholder="0" required />
        <small id="ws-balance-hint" class="text-muted" style="display: block; margin-top: 4px; font-size: 11px;">
          Số tiền thực tế hiện có trong ví.
        </small>
      </div>

      <div class="form-group">
        <label class="form-label">Màu sắc nhận diện</label>
        <div class="wallet-color-palette" id="ws-color-palette"></div>
      </div>

      <div class="flex gap-3 justify-between" style="margin-top: var(--space-4);">
        <button type="button" class="btn-v2 btn-v2-secondary" id="ws-btn-cancel">Hủy</button>
        <button type="submit" class="btn-v2 btn-v2-primary" style="flex: 1;">
          ${isEdit ? 'Lưu Thay Đổi' : 'Tạo Ví Mới'}
        </button>
      </div>
    </form>
  `;

  const nameInput = content.querySelector('#ws-wallet-name');
  const typeSelect = content.querySelector('#ws-wallet-type');
  const balanceInput = content.querySelector('#ws-wallet-initial');
  const balanceLabel = content.querySelector('#ws-balance-label');
  const balanceHint = content.querySelector('#ws-balance-hint');
  const paletteEl = content.querySelector('#ws-color-palette');
  const cancelBtn = content.querySelector('#ws-btn-cancel');
  const form = content.querySelector('#wallet-sheet-form');

  // Populate color swatches
  WALLET_COLORS.forEach(c => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = `wallet-color-swatch${c === selectedColor ? ' active' : ''}`;
    swatch.style.backgroundColor = safeColor(c);
    swatch.setAttribute('aria-label', `Chọn màu ${c}`);
    swatch.addEventListener('click', () => {
      selectedColor = c;
      paletteEl.querySelectorAll('.wallet-color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
    paletteEl.appendChild(swatch);
  });

  // Populate form fields
  if (existingWallet) {
    nameInput.value = existingWallet.name || '';
    typeSelect.value = existingWallet.type || 'bank';
    balanceInput.value = initialBal ? formatNumber(initialBal) : '0';
  } else {
    typeSelect.value = 'bank';
    balanceInput.value = '';
  }

  attachCurrencyInput(balanceInput);

  function updateHints() {
    if (typeSelect.value === 'credit') {
      balanceLabel.textContent = 'Hạn mức / Dư nợ ban đầu (VNĐ)';
      balanceHint.textContent = '⚡ Thẻ tín dụng tiêu trước trả sau, không được tính cộng vào Tổng tài sản.';
    } else {
      balanceLabel.textContent = 'Số dư ban đầu (VNĐ) *';
      balanceHint.textContent = isEdit
        ? 'Số dư lúc bắt đầu ghi sổ. Để khớp tiền hiện tại, dùng ô "Số dư thực tế" ở trên.'
        : 'Số tiền thực tế hiện có trong ví.';
    }
  }
  typeSelect.addEventListener('change', updateHints);
  updateHints();

  // Editing an existing wallet: let the user type the real-world balance instead of recomputing the initial one.
  const actualField = existingWallet
    ? mountActualBalanceField({ anchor: balanceInput.closest('.form-group'), wallet: existingWallet, typeSelect, initialInput: balanceInput })
    : null;

  cancelBtn.addEventListener('click', () => sheet?.close());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      showToast('Vui lòng nhập tên ví', 'error');
      nameInput.focus();
      return;
    }
    const type = typeSelect.value;
    const initialBalance = actualField?.getInitialOverride() ?? getCurrencyValue(balanceInput);

    if (isEdit) {
      stateStore.updateWallet(walletId, {
        name,
        type,
        initialBalance,
        color: selectedColor
      });
      showToast('Đã cập nhật ví', 'success');
    } else {
      stateStore.addWallet({
        name,
        type,
        initialBalance,
        color: selectedColor
      });
      showToast('Đã thêm ví mới', 'success');
    }

    if (typeof onDone === 'function') onDone();
    sheet?.close();
  });

  sheet = openSheet({
    title: isEdit ? 'Chỉnh Sửa Ví' : 'Thêm Ví Mới',
    content
  });

  requestAnimationFrame(() => nameInput.focus());

  return {
    close: sheet.close,
    closed: sheet.closed
  };
}
