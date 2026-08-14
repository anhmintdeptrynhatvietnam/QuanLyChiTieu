---
phase: 1
title: "Nâng cấp GoogleSheetsService (Push, Pull, Safe Snapshot, Undo Restore)"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 01: Nâng cấp GoogleSheetsService

## Overview
Cập nhật tầng dịch vụ `GoogleSheetsService` để hỗ trợ đầy đủ các hàm xử lý 2 chiều: Đẩy lên (Push), Kéo về (Pull), tự động tạo bản sao lưu an toàn (Safe Snapshot) trước khi nạp dữ liệu đám mây và cơ chế Hoàn tác (Undo Restore).

## Requirements
- **Functional**:
  - Tách hàm `sync` hoặc cung cấp 2 phương thức rõ ràng: `push(accessToken)` và `pull(accessToken)`.
  - `push(accessToken)`: Tìm hoặc tạo file spreadsheet `QuanLyChiTieu_DB` trên Drive, ghi đè dữ liệu 5 sheet (`Transactions`, `Wallets`, `Categories`, `Budgets`, `Debts`), cập nhật trạng thái `lastSyncTime`.
  - `pull(accessToken)`: Đọc dữ liệu 5 sheet từ file spreadsheet, tự động lưu snapshot `localStorage.setItem('quanlythuchi_pre_pull_backup', JSON.stringify(stateStore.getState()))`, gọi `stateStore.importAllData(cloudData)`, cập nhật `lastSyncTime`.
  - `restorePrePullBackup()`: Đọc bản snapshot từ `localStorage` và nạp lại vào `stateStore` nếu người dùng muốn hoàn tác.
  - `hasPrePullBackup()`: Kiểm tra xem có bản sao lưu trước khi kéo để kích hoạt nút Hoàn tác trên giao diện.
- **Non-functional**:
  - Đảm bảo bẫy lỗi chi tiết (token hết hạn, không tìm thấy file, định dạng dữ liệu lỗi) và thông báo qua `stateStore.setSyncStatus`.

## Related Code Files
- Modify: `js/services/google-sheets.js`
- Modify: `js/state.js` (nếu cần mở rộng action quản lý sync state)

## Implementation Steps
1. Mở file [google-sheets.js](file:///c:/Users/anhmi/OneDrive/Desktop/Tool/QuanLyThuChi/js/services/google-sheets.js).
2. Chuẩn hóa hàm `push(accessToken)` và `pull(accessToken)`.
3. Bổ sung các phương thức snapshot: `savePrePullBackup(state)`, `restorePrePullBackup()`, `hasPrePullBackup()`, `clearPrePullBackup()`.
4. Đảm bảo hàm `pullData` xử lý chuẩn mảng `repayments` của Debts, kiểu dữ liệu Number của amount, số dư ví.

## Success Criteria
- [ ] Hàm `GoogleSheetsService.push(accessToken)` ghi đè thành công 5 sheets lên Google Drive.
- [ ] Hàm `GoogleSheetsService.pull(accessToken)` đọc thành công 5 sheets, tạo snapshot dự phòng và nạp đúng vào `stateStore`.
- [ ] Hàm `GoogleSheetsService.restorePrePullBackup()` khôi phục chính xác trạng thái trước khi kéo về.

## Risk Assessment
- **Token OAuth 2.0 hết hạn (1 tiếng)**: Mitigate bằng cách kiểm tra token qua `googleAuthService.getValidToken()`, nếu hết hạn sẽ tự động kích hoạt popup đăng nhập lại.
