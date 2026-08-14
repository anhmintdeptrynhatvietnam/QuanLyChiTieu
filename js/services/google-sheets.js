/**
 * Google Sheets API v4 Integration & Sync Engine
 */
import { stateStore } from '../state.js';

export class GoogleSheetsService {
  static async findOrCreateSpreadsheet(accessToken, sheetName = 'QuanLyChiTieu_DB') {
    // 1. Search for existing spreadsheet in Google Drive
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(sheetName)}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name)`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // 2. If not found, create new spreadsheet with 6 tabs
    const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const body = {
      properties: { title: sheetName },
      sheets: [
        { properties: { title: 'Transactions' } },
        { properties: { title: 'Wallets' } },
        { properties: { title: 'Categories' } },
        { properties: { title: 'Budgets' } },
        { properties: { title: 'Debts' } },
        { properties: { title: 'Settings' } }
      ]
    };

    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!createRes.ok) throw new Error('Không thể tạo file Google Sheet');
    const createdData = await createRes.json();
    return createdData.spreadsheetId;
  }

  static async pushData(accessToken, spreadsheetId, state) {
    const valueData = [
      // 1. Transactions Sheet
      {
        range: 'Transactions!A1:J',
        values: [
          ['id', 'date', 'type', 'amount', 'categoryId', 'walletId', 'toWalletId', 'note', 'createdAt', 'updatedAt'],
          ...state.transactions.map(t => [
            t.id, t.date, t.type, t.amount, t.categoryId || '', t.walletId || '', t.toWalletId || '', t.note || '', t.createdAt || '', t.updatedAt || ''
          ])
        ]
      },
      // 2. Wallets Sheet
      {
        range: 'Wallets!A1:G',
        values: [
          ['id', 'name', 'type', 'initialBalance', 'currentBalance', 'icon', 'color'],
          ...state.wallets.map(w => [w.id, w.name, w.type, w.initialBalance, w.currentBalance, w.icon || '', w.color || ''])
        ]
      },
      // 3. Categories Sheet
      {
        range: 'Categories!A1:E',
        values: [
          ['id', 'name', 'type', 'icon', 'color'],
          ...state.categories.map(c => [c.id, c.name, c.type, c.icon || '', c.color || ''])
        ]
      },
      // 4. Budgets Sheet
      {
        range: 'Budgets!A1:D',
        values: [
          ['id', 'categoryId', 'month', 'limitAmount'],
          ...state.budgets.map(b => [b.id, b.categoryId, b.month, b.limitAmount])
        ]
      },
      // 5. Debts Sheet
      {
        range: 'Debts!A1:K',
        values: [
          ['id', 'personName', 'type', 'amount', 'remainingAmount', 'walletId', 'dueDate', 'note', 'status', 'repaymentsJSON', 'createdAt'],
          ...(state.debts || []).map(d => [
            d.id, d.personName, d.type, d.amount, d.remainingAmount, d.walletId, d.dueDate || '', d.note || '', d.status, JSON.stringify(d.repayments || []), d.createdAt || ''
          ])
        ]
      }
    ];

    // Clear and batch update
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const res = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueData
      })
    });

    if (!res.ok) throw new Error('Lỗi cập nhật dữ liệu lên Google Sheets');
    return true;
  }

  static async pullData(accessToken, spreadsheetId) {
    const ranges = ['Transactions!A2:J', 'Wallets!A2:G', 'Categories!A2:E', 'Budgets!A2:D', 'Debts!A2:K'];
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&')}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error('Lỗi lấy dữ liệu từ Google Sheets');

    const result = await res.json();
    const [txRange, walletRange, catRange, budgetRange, debtRange] = result.valueRanges;

    const transactions = (txRange?.values || []).map(row => ({
      id: row[0], date: row[1], type: row[2], amount: Number(row[3]) || 0,
      categoryId: row[4] || '', walletId: row[5] || '', toWalletId: row[6] || null,
      note: row[7] || '', createdAt: row[8] || new Date().toISOString(), updatedAt: row[9] || new Date().toISOString()
    }));

    const wallets = (walletRange?.values || []).map(row => ({
      id: row[0], name: row[1], type: row[2], initialBalance: Number(row[3]) || 0,
      currentBalance: Number(row[4]) || 0, icon: row[5] || 'wallet', color: row[6] || '#3b82f6'
    }));

    const categories = (catRange?.values || []).map(row => ({
      id: row[0], name: row[1], type: row[2], icon: row[3] || 'tag', color: row[4] || '#94a3b8'
    }));

    const budgets = (budgetRange?.values || []).map(row => ({
      id: row[0], categoryId: row[1], month: row[2], limitAmount: Number(row[3]) || 0
    }));

    const debts = (debtRange?.values || []).map(row => {
      let repayments = [];
      try {
        repayments = row[9] ? JSON.parse(row[9]) : [];
      } catch (e) {
        repayments = [];
      }
      return {
        id: row[0],
        personName: row[1],
        type: row[2],
        amount: Number(row[3]) || 0,
        remainingAmount: Number(row[4]) || 0,
        walletId: row[5],
        dueDate: row[6] || null,
        note: row[7] || '',
        status: row[8] || 'pending',
        repayments,
        createdAt: row[10] || new Date().toISOString()
      };
    });

    return {
      transactions: transactions.length ? transactions : undefined,
      wallets: wallets.length ? wallets : undefined,
      categories: categories.length ? categories : undefined,
      budgets: budgets.length ? budgets : undefined,
      debts: debts.length ? debts : undefined
    };
  }

  static async sync(accessToken) {
    stateStore.setSyncStatus({ status: 'syncing', message: 'Đang đồng bộ với Google Sheets...' });
    try {
      const state = stateStore.getState();
      let sheetId = state.settings.spreadsheetId;

      if (!sheetId) {
        sheetId = await this.findOrCreateSpreadsheet(accessToken, state.settings.spreadsheetName || 'QuanLyChiTieu_DB');
        stateStore.updateSettings({ spreadsheetId: sheetId });
      }

      // Push current local data up
      await this.pushData(accessToken, sheetId, state);

      const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      stateStore.updateSettings({ lastSyncTime: new Date().toISOString() });
      stateStore.setSyncStatus({ status: 'synced', message: `Đã đồng bộ lúc ${nowStr}`, lastSync: new Date().toISOString() });
      return { success: true, sheetId };
    } catch (err) {
      console.error('Sync Error:', err);
      stateStore.setSyncStatus({ status: 'error', message: 'Đồng bộ thất bại: ' + err.message });
      throw err;
    }
  }
}
