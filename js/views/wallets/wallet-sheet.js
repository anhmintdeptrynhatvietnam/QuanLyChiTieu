/**
 * Bottom sheet form for Adding / Editing Wallets
 */
import { openSheet } from '../../ui/bottom-sheet.js';
import { stateStore } from '../../state.js';
import { escapeHtml, safeColor } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';
import { mountBalanceField } from './wallet-balance-field.js';

const WALLET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export function openWalletSheet({ walletId = null, onDone = null } = {}) {
  let sheet;
  const isEdit = Boolean(walletId);
  const state = stateStore.getState();
  const existingWallet = isEdit ? state.wallets.find(w => w.id === walletId) : null;

  const content = document.createElement('div');
  content.className = 'wallet-form-container';

  let selectedColor = existingWallet?.color || WALLET_COLORS[0];

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

      <div id="ws-balance-slot"></div>

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
  } else {
    typeSelect.value = 'bank';
  }

  // Users only see the current balance; the stored initial balance is derived from it.
  const balanceField = mountBalanceField({
    container: content.querySelector('#ws-balance-slot'),
    wallet: existingWallet,
    typeSelect
  });

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
    const initialBalance = balanceField.getInitialBalance();

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
