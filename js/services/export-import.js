/**
 * Backup & Restore Service (JSON & CSV Export / Import)
 */
import { stateStore } from '../state.js';
import { DEFAULT_FIREBASE_CONFIG } from '../config.js';
import { sanitizeForExport, toCsvCell } from '../domain/export-sanitize.js';
import { getCurrentDateFormatted } from '../utils/helpers.js';

export class ExportImportService {
  static exportJSON() {
    ExportImportService.downloadJSON(stateStore.getState(), 'QuanLyChiTieu_Backup');
  }

  /**
   * Download any state-shaped object ({ transactions, wallets, ... }) as an importable JSON backup.
   * @param {Object} data
   * @param {string} filePrefix
   */
  static downloadJSON(data, filePrefix) {
    const jsonStr = JSON.stringify(sanitizeForExport(data, DEFAULT_FIREBASE_CONFIG), null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${filePrefix}_${getCurrentDateFormatted()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  }

  static exportCSV() {
    const state = stateStore.getState();
    const headers = ['Mã GD', 'Ngày', 'Loại', 'Số tiền (VNĐ)', 'Hạng mục', 'Ví nguồn', 'Ví đích', 'Ghi chú'];
    const rows = state.transactions.map(t => {
      const cat = state.categories.find(c => c.id === t.categoryId);
      const wallet = state.wallets.find(w => w.id === t.walletId);
      const toWallet = t.toWalletId ? state.wallets.find(w => w.id === t.toWalletId) : null;
      const typeStr = t.type === 'income' ? 'Thu nhập' : (t.type === 'expense' ? 'Chi tiêu' : 'Chuyển tiền');

      return [
        toCsvCell(t.id),
        toCsvCell(t.date),
        toCsvCell(typeStr),
        toCsvCell(typeof t.amount === 'number' ? t.amount : (Number(t.amount) || 0)),
        toCsvCell(cat?.name || ''),
        toCsvCell(wallet?.name || ''),
        toCsvCell(toWallet?.name || ''),
        toCsvCell(t.note || '')
      ];
    });

    const headerLine = headers.map(h => toCsvCell(h)).join(',');
    const csvContent = '\uFEFF' + [headerLine, ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LichSuGiaoDich_${getCurrentDateFormatted()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  static importJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || (!parsed.transactions && !parsed.wallets)) {
          throw new Error('Định dạng file sao lưu không hợp lệ');
        }
        stateStore.importAllData(parsed);
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    };
    reader.readAsText(file);
  }
}
