/**
 * Inline Category Creation Modal Sheet
 * Opens a small dialog to create a new category and returns the created record.
 */
import { openSheet } from '../../ui/bottom-sheet.js';
import { stateStore } from '../../state.js';
import { showToast } from '../../components/toast.js';
import { escapeHtml } from '../../utils/helpers.js';

/**
 * Open dialog to create a new category
 * @param {object} options
 * @param {'expense'|'income'} [options.type='expense']
 * @param {Function} [options.onCreated] - callback receiving new category object
 */
export function openCategoryCreateSheet({ type = 'expense', onCreated = null } = {}) {
  const isIncome = type === 'income';
  const typeLabel = isIncome ? 'thu nhập' : 'chi tiêu';

  const content = document.createElement('div');
  content.className = 'flex flex-col gap-4';

  content.innerHTML = `
    <form id="form-create-category" class="flex flex-col gap-4" novalidate>
      <div class="form-group">
        <label class="form-label" for="new-category-name">Tên hạng mục ${escapeHtml(typeLabel)} *</label>
        <input
          type="text"
          id="new-category-name"
          class="form-input"
          placeholder="Ví dụ: Ăn vặt, Tiền điện, Cà phê..."
          autocomplete="off"
          required
        />
        <div id="new-category-error" class="sheet-field-error" style="display: none;"></div>
      </div>

      <div class="flex gap-2 justify-end" style="margin-top: var(--space-2);">
        <button type="button" class="btn btn-v2 btn-v2-secondary" id="btn-cancel-create-cat">Hủy</button>
        <button type="submit" class="btn btn-v2 btn-v2-primary" id="btn-submit-create-cat">Tạo hạng mục</button>
      </div>
    </form>
  `;

  const sheet = openSheet({
    title: `Thêm hạng mục ${typeLabel}`,
    content,
    size: 'small'
  });

  const form = content.querySelector('#form-create-category');
  const nameInput = content.querySelector('#new-category-name');
  const errorEl = content.querySelector('#new-category-error');
  const cancelBtn = content.querySelector('#btn-cancel-create-cat');

  cancelBtn.addEventListener('click', () => sheet.close());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (nameInput.value || '').trim();

    if (!name) {
      errorEl.textContent = 'Vui lòng nhập tên hạng mục';
      errorEl.style.display = 'block';
      nameInput.focus();
      return;
    }

    try {
      const newCategory = stateStore.addCategory({ name, type });
      showToast(`Đã thêm hạng mục "${name}"`, 'success');

      if (typeof onCreated === 'function') {
        onCreated(newCategory);
      }
      sheet.close();
    } catch (err) {
      errorEl.textContent = err?.message || 'Có lỗi xảy ra khi tạo hạng mục';
      errorEl.style.display = 'block';
    }
  });

  setTimeout(() => {
    if (nameInput) nameInput.focus();
  }, 100);

  return sheet;
}
