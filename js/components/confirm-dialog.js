/**
 * Themed Confirm Dialog (singleton) — replaces native window.confirm().
 * Supports an optional type-to-confirm gate for destructive actions.
 */
export class ConfirmDialog {
  static _ensure() {
    let overlay = document.getElementById('confirm-dialog-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'confirm-dialog-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width: 420px;">
        <h3 id="confirm-dialog-title" style="margin-bottom: var(--space-3);"></h3>
        <p id="confirm-dialog-message" style="margin-bottom: var(--space-5);"></p>
        <div class="form-group hidden" id="confirm-dialog-input-wrap">
          <input type="text" class="form-input" id="confirm-dialog-input" autocomplete="off">
        </div>
        <div class="flex gap-3" style="justify-content: flex-end;">
          <button class="btn btn-secondary" id="confirm-dialog-cancel"></button>
          <button class="btn" id="confirm-dialog-ok"></button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  /**
   * @param {object} opts
   * @param {string} opts.title
   * @param {string} opts.message
   * @param {string} [opts.confirmText]
   * @param {string} [opts.cancelText]
   * @param {boolean} [opts.danger] - style the confirm button as destructive
   * @param {string|null} [opts.requireText] - if set, confirm stays disabled
   *   until the user types this exact text (type-to-confirm gate)
   * @returns {Promise<boolean>}
   */
  static show({
    title = 'Xác nhận',
    message = '',
    confirmText = 'Xác nhận',
    cancelText = 'Huỷ',
    danger = false,
    requireText = null
  } = {}) {
    const overlay = ConfirmDialog._ensure();
    const titleEl = overlay.querySelector('#confirm-dialog-title');
    const msgEl = overlay.querySelector('#confirm-dialog-message');
    const okBtn = overlay.querySelector('#confirm-dialog-ok');
    const cancelBtn = overlay.querySelector('#confirm-dialog-cancel');
    const inputWrap = overlay.querySelector('#confirm-dialog-input-wrap');
    const input = overlay.querySelector('#confirm-dialog-input');

    titleEl.textContent = title;
    titleEl.id = 'confirm-dialog-title';
    msgEl.textContent = message;
    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    okBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';
    inputWrap.classList.toggle('hidden', !requireText);
    input.value = '';
    okBtn.disabled = Boolean(requireText);

    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'confirm-dialog-title');
    overlay.classList.add('active');

    return new Promise((resolve) => {
      const cleanup = (result) => {
        overlay.classList.remove('active');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onBackdrop);
        document.removeEventListener('keydown', onKeydown);
        input.removeEventListener('input', onInput);
        resolve(result);
      };
      const onOk = () => { if (!okBtn.disabled) cleanup(true); };
      const onCancel = () => cleanup(false);
      const onBackdrop = (e) => { if (e.target === overlay) cleanup(false); };
      const onKeydown = (e) => { if (e.key === 'Escape') cleanup(false); };
      const onInput = () => { okBtn.disabled = input.value.trim() !== requireText; };

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      overlay.addEventListener('click', onBackdrop);
      document.addEventListener('keydown', onKeydown);
      if (requireText) input.addEventListener('input', onInput);

      setTimeout(() => (requireText ? input : okBtn).focus(), 150);
    });
  }
}

export function confirmDialog(message, options = {}) {
  return ConfirmDialog.show({ message, ...options });
}

/**
 * Themed text-input prompt — replaces native window.prompt().
 * @param {string} message
 * @param {object} [opts]
 * @param {string} [opts.title]
 * @param {string} [opts.placeholder]
 * @param {string} [opts.confirmText]
 * @param {string} [opts.cancelText]
 * @returns {Promise<string|null>} the trimmed input, or null if cancelled
 */
export function promptDialog(message, {
  title = 'Nhập thông tin',
  placeholder = '',
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ'
} = {}) {
  const overlay = ConfirmDialog._ensure();
  const titleEl = overlay.querySelector('#confirm-dialog-title');
  const msgEl = overlay.querySelector('#confirm-dialog-message');
  const okBtn = overlay.querySelector('#confirm-dialog-ok');
  const cancelBtn = overlay.querySelector('#confirm-dialog-cancel');
  const inputWrap = overlay.querySelector('#confirm-dialog-input-wrap');
  const input = overlay.querySelector('#confirm-dialog-input');

  titleEl.textContent = title;
  titleEl.id = 'confirm-dialog-title';
  msgEl.textContent = message;
  okBtn.textContent = confirmText;
  cancelBtn.textContent = cancelText;
  okBtn.className = 'btn btn-primary';
  inputWrap.classList.remove('hidden');
  input.placeholder = placeholder;
  input.value = '';
  okBtn.disabled = true;

  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'confirm-dialog-title');
  overlay.classList.add('active');

  return new Promise((resolve) => {
    const cleanup = (result) => {
      overlay.classList.remove('active');
      input.placeholder = '';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKeydown);
      input.removeEventListener('input', onInput);
      resolve(result);
    };
    const onOk = () => { if (!okBtn.disabled) cleanup(input.value.trim()); };
    const onCancel = () => cleanup(null);
    const onBackdrop = (e) => { if (e.target === overlay) cleanup(null); };
    const onKeydown = (e) => {
      if (e.key === 'Escape') cleanup(null);
      else if (e.key === 'Enter' && !okBtn.disabled) cleanup(input.value.trim());
    };
    const onInput = () => { okBtn.disabled = input.value.trim() === ''; };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKeydown);
    input.addEventListener('input', onInput);

    setTimeout(() => input.focus(), 150);
  });
}
