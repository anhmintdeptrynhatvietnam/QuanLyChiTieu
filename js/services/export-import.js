/**
 * Backup & Restore Service (JSON & CSV Export / Import)
 */
import { stateStore } from '../state.js';
import { getCurrentDateFormatted } from '../utils/helpers.js';

export class ExportImportService {
  static exportJSON() {
    const state = stateStore.getState();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `QuanLyChiTieu_Backup_${getCurrentDateFormatted()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
        t.id,
        t.date,
        typeStr,
        t.amount,
        `"${cat?.name || ''}"`,
        `"${wallet?.name || ''}"`,
        `"${toWallet?.name || ''}"`,
        `"${(t.note || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LichSuGiaoDich_${getCurrentDateFormatted()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
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
