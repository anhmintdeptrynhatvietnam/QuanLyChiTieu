/**
 * Settings Section: Category Management (Add, Rename, Delete)
 */
import { stateStore } from '../../state.js';
import { showToast } from '../../components/toast.js';
import { confirmDialog } from '../../components/confirm-dialog.js';
import { openSheet } from '../../ui/bottom-sheet.js';
import { escapeHtml, safeColor } from '../../utils/helpers.js';
import { CATEGORY_PALETTE } from '../../config.js';

export function renderCategoriesSection(state) {
  const expenseCats = state.categories.filter(c => c.type === 'expense');
  const incomeCats = state.categories.filter(c => c.type === 'income');

  return `
    <div class="card-v2 settings-categories-card">
      <div class="settings-card-header">
        <div>
          <h3 class="settings-card-title">Quản Lý Hạng Mục</h3>
          <small class="text-muted">Tùy biến danh mục chi tiêu & thu nhập theo nhu cầu</small>
        </div>
      </div>

      <!-- Add Category Form -->
      <div class="settings-add-cat-form">
        <input type="text" id="new-cat-name" class="form-input" placeholder="Tên loại mới (Ví dụ: Thể thao...)" style="flex: 2; min-width: 160px;">
        <select id="new-cat-type" class="form-select" style="flex: 1; min-width: 110px;">
          <option value="expense">Chi tiêu</option>
          <option value="income">Thu nhập</option>
        </select>
        <button type="button" class="btn-v2 btn-v2-primary" id="btn-add-category" style="flex-shrink: 0;">
          <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
          <span>Thêm</span>
        </button>
      </div>

      <!-- Categories Lists -->
      <div class="flex flex-col gap-4">
        <!-- Expense Categories -->
        <div>
          <div class="flex items-center gap-2" style="margin-bottom: var(--space-2);">
            <i data-lucide="trending-down" style="width: 14px; height: 14px; color: var(--expense-primary);"></i>
            <span class="font-semibold text-secondary" style="font-size: var(--font-size-sm);">
              Chi Tiêu (${expenseCats.length})
            </span>
          </div>
          <div class="settings-cat-chips-wrap">
            ${expenseCats.map(c => renderCategoryChip(c)).join('')}
          </div>
        </div>

        <!-- Income Categories -->
        <div>
          <div class="flex items-center gap-2" style="margin-bottom: var(--space-2);">
            <i data-lucide="trending-up" style="width: 14px; height: 14px; color: var(--income-primary);"></i>
            <span class="font-semibold text-secondary" style="font-size: var(--font-size-sm);">
              Thu Nhập (${incomeCats.length})
            </span>
          </div>
          <div class="settings-cat-chips-wrap">
            ${incomeCats.map(c => renderCategoryChip(c)).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCategoryChip(c) {
  return `
    <div class="settings-cat-chip">
      <span class="settings-cat-chip-dot" style="background-color: ${safeColor(c.color || '#f97316')};"></span>
      <span class="settings-cat-chip-name">${escapeHtml(c.name)}</span>
      <button type="button" class="settings-cat-action btn-edit-cat" data-id="${escapeHtml(c.id)}" title="Sửa tên / màu">
        <i data-lucide="pencil" style="width: 12px; height: 12px;"></i>
      </button>
      <button type="button" class="settings-cat-action btn-delete-cat" data-id="${escapeHtml(c.id)}" title="Xóa hạng mục">
        <i data-lucide="x" style="width: 12px; height: 12px;"></i>
      </button>
    </div>
  `;
}

export function bindCategoriesEvents(container) {
  // Add Category
  container.querySelector('#btn-add-category')?.addEventListener('click', () => {
    const nameInput = container.querySelector('#new-cat-name');
    const typeSelect = container.querySelector('#new-cat-type');
    const name = nameInput?.value.trim();
    const type = typeSelect?.value || 'expense';

    if (!name) {
      showToast('Vui lòng nhập tên hạng mục', 'error');
      return;
    }

    const randomColor = CATEGORY_PALETTE[Math.floor(Math.random() * CATEGORY_PALETTE.length)];
    stateStore.addCategory({ name, type, color: randomColor });
    if (nameInput) nameInput.value = '';
    showToast(`Đã thêm hạng mục "${name}"`, 'success');
  });

  // Edit / Rename Category via Bottom Sheet
  container.querySelectorAll('.btn-edit-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const cat = stateStore.getState().categories.find(c => c.id === id);
      if (!cat) return;
      openEditCategorySheet(cat);
    });
  });

  // Delete Category
  container.querySelectorAll('.btn-delete-cat').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const ok = await confirmDialog('Bạn có chắc chắn muốn xóa hạng mục này?', { danger: true });
      if (ok) {
        const res = stateStore.deleteCategory(id);
        if (!res.success) {
          showToast(res.reason, 'error');
        } else {
          showToast('Đã xóa hạng mục', 'info');
        }
      }
    });
  });
}

function openEditCategorySheet(cat) {
  let selectedColor = cat.color || '#3b82f6';
  const form = document.createElement('div');
  form.className = 'flex flex-col gap-4';
  form.innerHTML = `
    <div class="form-group" style="margin-bottom: 0;">
      <label class="form-label">Tên hạng mục</label>
      <input type="text" id="edit-cat-name" class="form-input" value="${escapeHtml(cat.name)}">
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label class="form-label">Loại</label>
      <select id="edit-cat-type" class="form-select">
        <option value="expense" ${cat.type === 'expense' ? 'selected' : ''}>Chi tiêu</option>
        <option value="income" ${cat.type === 'income' ? 'selected' : ''}>Thu nhập</option>
      </select>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label class="form-label">Màu sắc</label>
      <div class="settings-palette-grid">
        ${CATEGORY_PALETTE.map(c => `
          <button type="button" class="settings-palette-btn ${c.toLowerCase() === selectedColor.toLowerCase() ? 'active' : ''}" data-color="${c}" style="background-color: ${c};"></button>
        `).join('')}
      </div>
    </div>
    <div class="flex justify-end gap-2" style="margin-top: var(--space-2);">
      <button type="button" class="btn-v2 btn-v2-secondary" id="btn-cancel-edit-cat">Huỷ</button>
      <button type="button" class="btn-v2 btn-v2-primary" id="btn-save-edit-cat">Lưu thay đổi</button>
    </div>
  `;

  const sheet = openSheet({
    title: 'Sửa hạng mục',
    content: form
  });

  form.querySelectorAll('.settings-palette-btn').forEach(b => {
    b.addEventListener('click', () => {
      form.querySelectorAll('.settings-palette-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      selectedColor = b.getAttribute('data-color') || selectedColor;
    });
  });

  form.querySelector('#btn-cancel-edit-cat')?.addEventListener('click', () => sheet.close());
  form.querySelector('#btn-save-edit-cat')?.addEventListener('click', () => {
    const newName = form.querySelector('#edit-cat-name')?.value.trim();
    const newType = form.querySelector('#edit-cat-type')?.value;
    if (!newName) {
      showToast('Tên không được để trống', 'error');
      return;
    }
    stateStore.updateCategory(cat.id, {
      name: newName,
      type: newType,
      color: selectedColor
    });
    showToast('Đã cập nhật hạng mục', 'success');
    sheet.close();
  });
}
