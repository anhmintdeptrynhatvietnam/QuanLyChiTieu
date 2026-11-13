/**
 * Wallet Picker Component
 * Horizontal scrollable chips for selecting a wallet/account.
 * Respects privacy masking via js/utils/privacy.js.
 */
import { formatCurrency } from '../utils/formatters.js';
import { escapeHtml, safeColor } from '../utils/helpers.js';
import { isAmountVisible } from '../utils/privacy.js';

/**
 * Render wallet picker chips
 * @param {object} options
 * @param {Array<object>} [options.wallets]
 * @param {string|number|null} [options.selectedId]
 * @param {Function} [options.onSelect] - (walletId, walletObj) => void
 * @param {string|number|null} [options.excludeId] - wallet id to exclude from selection
 * @param {boolean} [options.showBalance=true]
 * @returns {HTMLElement}
 */
export function renderWalletPicker({
  wallets = [],
  selectedId = null,
  onSelect = null,
  excludeId = null,
  showBalance = true
} = {}) {
  const container = document.createElement('div');
  container.className = 'wallet-picker';
  container.setAttribute('role', 'radiogroup');
  container.setAttribute('aria-label', 'Chọn ví hoặc tài khoản');

  const filtered = Array.isArray(wallets)
    ? wallets.filter((w) => !excludeId || String(w.id) !== String(excludeId))
    : [];

  let currentSelectedId = selectedId;

  filtered.forEach((wallet) => {
    const isSelected = String(wallet.id) === String(currentSelectedId);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `wallet-chip${isSelected ? ' active' : ''}`;
    chip.setAttribute('role', 'radio');
    chip.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    chip.setAttribute('data-id', String(wallet.id));

    const color = safeColor(wallet.color || '#4f46e5');
    let balanceHtml = '';

    if (showBalance) {
      const balanceVal = Number(wallet.currentBalance ?? wallet.initialBalance ?? 0);
      const isVisible = isAmountVisible(`wallet_${wallet.id}`);
      const formatted = isVisible ? formatCurrency(balanceVal) : '••••••';
      balanceHtml = `<span class="wallet-chip-balance num">${formatted}</span>`;
    }

    chip.innerHTML = `
      <span class="wallet-chip-dot" style="background-color: ${color};"></span>
      <span class="wallet-chip-name">${escapeHtml(wallet.name)}</span>
      ${balanceHtml}
    `;

    chip.addEventListener('click', () => {
      container.querySelectorAll('.wallet-chip').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-checked', 'true');
      currentSelectedId = wallet.id;

      if (typeof onSelect === 'function') {
        onSelect(wallet.id, wallet);
      }
    });

    container.appendChild(chip);
  });

  return container;
}
