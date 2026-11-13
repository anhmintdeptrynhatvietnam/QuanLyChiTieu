---
phase: 6
title: "Ví · Vay/Nợ · Ngân sách"
status: completed
dependencies: [1, 2]
---

# Phase 06: Ví · Vay/Nợ · Ngân sách

## Requirements
- Ví: thẻ tổng + danh sách ví (icon, tên, số dư); thêm/sửa ví bằng bottom sheet; chuyển tiền mở sheet phase 03 ở chế độ Chuyển.
- Vay/Nợ: 2 thẻ tổng (Cho vay / Đi vay), chip lọc, danh sách khoản (tiến độ đã trả), chạm → sheet chi tiết (lịch sử trả, nút Thu/Trả nợ dùng debt-sheet phase 03).
- Ngân sách: chọn tháng, danh sách hạng mục có thanh tiến độ, đặt/xoá hạn mức bằng sheet (dùng currency-input).

## Giữ nguyên hành vi
- Chặn xoá ví đang được giao dịch/khoản vay tham chiếu (thông báo rõ); `canRepay`; `deleteBudget`; che số.

## Files
- Create: `js/views/wallets/*.js`, `js/views/debts/*.js`, `js/views/budgets/*.js`. Delete: `js/components/wallets.js`, `debts.js`, `budgets.js`. `sw.js`.

## Success Criteria
- [ ] Thêm/sửa/xoá ví, tạo khoản vay, trả một phần, trả hết, đặt/xoá ngân sách đều chạy; số dư đúng.
