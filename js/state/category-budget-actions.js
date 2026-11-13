/**
 * Category & Budget Actions for State Store
 */
import { generateId } from '../utils/helpers.js';
import { getMonthYear } from '../utils/formatters.js';
import { CATEGORY_PALETTE, STORAGE_KEYS } from '../config.js';
import { StorageService } from '../services/storage.js';

export function ensureUniqueCategoryColors(categories) {
  const usedColors = new Set();
  let hasChanges = false;

  categories.forEach(cat => {
    const lowerColor = (cat.color || '').toLowerCase();
    if (!cat.color || usedColors.has(lowerColor)) {
      const available = CATEGORY_PALETTE.find(c => !usedColors.has(c.toLowerCase()));
      const newColor = available || CATEGORY_PALETTE[usedColors.size % CATEGORY_PALETTE.length];
      cat.color = newColor;
      usedColors.add(newColor.toLowerCase());
      hasChanges = true;
    } else {
      usedColors.add(lowerColor);
    }
  });

  if (hasChanges) {
    StorageService.set(STORAGE_KEYS.CATEGORIES, categories);
  }
}

export function getNextCategoryColor(categories, type = 'expense') {
  const usedColors = new Set(categories.map(c => (c.color || '').toLowerCase()));
  const available = CATEGORY_PALETTE.find(c => !usedColors.has(c.toLowerCase()));
  if (available) return available;
  return CATEGORY_PALETTE[categories.length % CATEGORY_PALETTE.length];
}

export function addCategory(store, category) {
  const color = category.color || getNextCategoryColor(store.state.categories, category.type || 'expense');
  const newCat = {
    id: generateId('cat'),
    name: category.name.trim(),
    type: category.type || 'expense', // 'expense' | 'income'
    icon: category.icon || (category.type === 'income' ? 'plus-circle' : 'tag'),
    color: color,
    createdAt: new Date().toISOString()
  };

  store.state.categories.push(newCat);
  store.notify('category:added', newCat);
  return newCat;
}

export function updateCategory(store, id, data) {
  const cat = store.state.categories.find(c => c.id === id);
  if (!cat) return null;

  Object.assign(cat, data);
  store.notify('category:updated', cat);
  return cat;
}

export function deleteCategory(store, id) {
  const hasTransactions = store.state.transactions.some(t => t.categoryId === id);
  if (hasTransactions) return { success: false, reason: 'Hạng mục đã có giao dịch phát sinh, không thể xóa' };

  store.state.categories = store.state.categories.filter(c => c.id !== id);
  store.state.budgets = store.state.budgets.filter(b => b.categoryId !== id);
  store.notify('category:deleted', id);
  return { success: true };
}

export function setBudget(store, categoryId, month, limitAmount) {
  const monthStr = month || getMonthYear();
  const existingIndex = store.state.budgets.findIndex(b => b.categoryId === categoryId && b.month === monthStr);
  const limit = Number(limitAmount) || 0;

  if (existingIndex > -1) {
    store.state.budgets[existingIndex].limitAmount = limit;
    store.state.budgets[existingIndex].updatedAt = new Date().toISOString();
  } else {
    store.state.budgets.push({
      id: generateId('budget'),
      categoryId,
      month: monthStr,
      limitAmount: limit,
      createdAt: new Date().toISOString()
    });
  }

  store.notify('budget:updated', { categoryId, month: monthStr });
}

export function deleteBudget(store, categoryId, month) {
  const initialLength = store.state.budgets.length;
  store.state.budgets = store.state.budgets.filter(b => !(b.categoryId === categoryId && b.month === month));
  if (store.state.budgets.length === initialLength) return false;

  store.notify('budget:deleted', { categoryId, month });
  return true;
}
