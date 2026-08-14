---
phase: 4
title: "Dashboard Widget, Sao lưu JSON & Google Sheets Sync"
status: pending
priority: P2
effort: "20m"
dependencies: [1, 2, 3]
---

# Phase 04: Dashboard Widget, Sao lưu JSON & Google Sheets Sync

## Overview
Hoàn thiện tính năng với widget nhắc nhở nợ trên Dashboard, bổ sung dữ liệu `debts` vào cơ chế xuất/nhập sao lưu JSON (`export-import.js`), và đồng bộ bảng tính Google Sheets (`google-sheets.js`).

## Requirements
- **Functional**:
  - **Dashboard (`js/components/dashboard.js`)**:
    - Thêm 1 thẻ/widget thông tin nhanh:
      - 💰 **Đang cho vay chưa thu:** `formatCurrency(totalReceivable)` (giúp người dùng nắm bắt số tiền đang cho mượn ngoài thị trường).
      - 💳 **Đang nợ cần trả:** `formatCurrency(totalPayable)` (nếu có).
    - Đảm bảo các chỉ số "Thu Nhập Tháng Này" và "Chi Tiêu Tháng Này" tuyệt đối không bị cộng dồn số tiền cho vay hay thu nợ.
  - **Sao lưu & Khôi phục (`js/services/export-import.js`)**:
    - Export JSON bao gồm cả mảng `debts`.
    - Import JSON khôi phục lại mảng `debts` vào `stateStore`.
  - **Đồng bộ Google Sheets (`js/services/google-sheets.js`)**:
    - Thêm sheet `Debts` trong Google Sheets để đồng bộ 2 chiều dữ liệu nợ và lịch sử thanh toán.

## Related Code Files
- Modify: `js/components/dashboard.js`
- Modify: `js/services/export-import.js`
- Modify: `js/services/google-sheets.js`

## Implementation Steps
1. Mở `js/components/dashboard.js`:
   - Tính tổng `totalReceivable` (tiền người khác nợ mình) và `totalPayable` (tiền mình nợ người khác).
   - Render widget thông tin nợ trên dashboard.
2. Mở `js/services/export-import.js`:
   - Bổ sung `debts: state.debts` vào cấu trúc export JSON.
   - Thêm xử lý `if (payload.debts) this.state.debts = payload.debts` khi import JSON.
3. Mở `js/services/google-sheets.js`:
   - Bổ sung định nghĩa sheet `Debts` và push dữ liệu các khoản nợ khi sync.

## Success Criteria
- [ ] Dashboard hiển thị thẻ thông báo số tiền đang cho vay.
- [ ] Xuất file JSON có chứa trường `debts`, nhập lại file JSON trên trình duyệt khác khôi phục đầy đủ sổ nợ.
- [ ] Đồng bộ Google Sheets không bị lỗi và tạo sheet `Debts` đầy đủ.
