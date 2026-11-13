---
phase: 3
title: "Ghi giao dịch nhanh (bottom sheet)"
status: completed
dependencies: [1, 2]
---

# Phase 03: Ghi giao dịch nhanh

## Requirements
- Sheet thay `transaction-modal.js` cho Chi / Thu / Chuyển tiền (segmented control trên cùng).
- Thứ tự: số tiền lớn (tự focus, bàn phím số `inputmode="numeric"`, chip +10k/+50k/+100k/+500k) → lưới hạng mục (Chi/Thu) hoặc ví đích (Chuyển) → ví nguồn (wallet-picker) → ngày (mặc định hôm nay, chip Hôm nay/Hôm qua + chọn ngày) → ghi chú (thu gọn) → nút Lưu dính đáy.
- Nhớ loại giao dịch + ví dùng lần trước (`localStorage` key `qlct_ui_last_entry`, chỉ id, try/catch).
- Chế độ sửa: mở sẵn dữ liệu, thêm nút Xoá (confirm).
- Vay/Nợ tách sheet riêng (`debt-sheet`): tạo khoản vay/cho vay và trả/thu nợ — dùng lại `canRepay`/`describeRepaymentError`.
- Sau khi lưu: toast + sheet đóng; nếu lưu lỗi (số tiền không hợp lệ, trả quá số còn lại) hiện lỗi tại ô, không đóng.

## Giữ nguyên hành vi
- Validate số tiền > 0; chuyển tiền cần 2 ví khác nhau; `updateTransaction` từ chối số tiền sai; tạo hạng mục mới ngay trong sheet (nút "+" trong lưới).

## Files
- Create: `js/domain/transaction-entry.js`, `js/views/transaction-sheet/*.js`, `js/views/debt-sheet/*.js`, `css/sheets.css`, `tests/transaction-entry.test.mjs`.
- Modify: `index.html`, `js/app.js`, `sw.js`.
- Delete: `js/components/transaction-modal.js` (unreferenced, removed from `sw.js`, deleted via git).

## Success Criteria
- [x] Ghi khoản chi 50k Ăn uống từ Tiền mặt: [+] → 50k → Ăn uống → Lưu.
- [x] Sửa/xoá giao dịch, chuyển ví, vay/trả nợ đều chạy và số dư ví đúng.
