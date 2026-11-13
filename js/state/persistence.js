/**
 * Local Storage Persistence for State Store
 */
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS, DEFAULT_SETTINGS, STORAGE_KEYS, LEGACY_LOCAL_STORAGE_KEYS } from '../config.js';
import { StorageService } from '../services/storage.js';
import { sanitizeLegacySettings } from '../domain/settings-migration.js';

export function loadInitialState() {
  return {
    transactions: StorageService.get(STORAGE_KEYS.TRANSACTIONS, []),
    wallets: StorageService.get(STORAGE_KEYS.WALLETS, DEFAULT_WALLETS),
    categories: StorageService.get(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES),
    budgets: StorageService.get(STORAGE_KEYS.BUDGETS, []),
    debts: StorageService.get(STORAGE_KEYS.DEBTS, []),
    settings: sanitizeLegacySettings(StorageService.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS))
  };
}

export function saveStateToStorage(state) {
  StorageService.set(STORAGE_KEYS.TRANSACTIONS, state.transactions);
  StorageService.set(STORAGE_KEYS.WALLETS, state.wallets);
  StorageService.set(STORAGE_KEYS.CATEGORIES, state.categories);
  StorageService.set(STORAGE_KEYS.BUDGETS, state.budgets);
  StorageService.set(STORAGE_KEYS.DEBTS, state.debts);
  StorageService.set(STORAGE_KEYS.SETTINGS, state.settings);
}

export function cleanupLegacyStorage() {
  LEGACY_LOCAL_STORAGE_KEYS.forEach(k => StorageService.remove(k));
}
