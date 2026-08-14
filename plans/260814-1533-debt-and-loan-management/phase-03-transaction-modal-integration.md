---
phase: 3
title: "Tích hợp Tab Vay/Nợ trong Modal Ghi chép"
status: pending
priority: P2
effort: "30m"
dependencies: [1, 2]
---

# Phase 03: Tích hợp Tab Vay/Nợ trong Modal Ghi chép

## Overview
Mở rộng Modal Ghi chép giao dịch nhanh (`js/components/transaction-modal.js`) với Tab thứ 4: **`🤝 Vay / Nợ`**, giúp người dùng có thể ghi nhận việc Cho vay, Thu nợ, Đi vay, Trả nợ ngay từ nút `+ Ghi chép` trên header hoặc FAB button ở mọi trang.

## Requirements
- **Functional**:
  - Modal thêm nút tab: `[🤝 Vay / Nợ]`.
  - Khi kích hoạt tab Vay / Nợ:
    - Hiển thị 4 nút chọn phụ (Sub-types):
      - 🔵 **Cho vay** *(Tiền ra khỏi ví → Ghi nợ người khác)*
      - 🟢 **Thu nợ** *(Họ trả tiền → Tiền vào ví → Giảm nợ)*
      - 🟠 **Đi vay** *(Nhận tiền vào ví → Ghi nhận nợ)*
      - 🔴 **Trả nợ** *(Trả tiền ra khỏi ví → Giảm nợ)*
    - Đối với `Cho vay` và `Đi vay`:
      - Hiển thị ô nhập tên người liên quan (có gợi ý từ danh bạ nợ cũ).
      - Ô chọn ví giao dịch.
      - Ô ngày hẹn trả (tùy chọn).
    - Đối với `Thu nợ` và `Trả nợ`:
      - Hiển thị dropdown chọn khoản nợ đang tồn tại để trừ nợ tương ứng.
      - Ô số tiền trả (tự điền số nợ còn lại hoặc người dùng sửa lại số tiền trả góp).
      - Ô chọn ví nhận/trả tiền.
    - Ẩn chọn Hạng mục thu chi (vì không phải thu chi thông thường).
  - Khi submit:
    - Nếu là tạo nợ mới (`lend`/`borrow`): Gọi `stateStore.addDebt(...)`.
    - Nếu là thu/trả nợ: Gọi `stateStore.recordRepayment(...)`.
    - Đóng modal và hiển thị thông báo thành công.

## Related Code Files
- Modify: `js/components/transaction-modal.js`

## Implementation Steps
1. Mở `js/components/transaction-modal.js`:
   - Thêm nút tab `Vay / Nợ` vào thanh tab type.
   - Thêm nhóm trường nhập liệu chuyên biệt cho Vay / Nợ trong form HTML.
   - Cập nhật logic `updateFormFields()` để hiển thị các trường phù hợp khi chọn tab `debt`.
   - Cập nhật hàm `handleSubmit()` để điều hướng lưu khoản nợ hoặc ghi nhận trả nợ tương ứng.

## Success Criteria
- [ ] Bấm nút `+ Ghi chép`, chuyển sang tab `Vay / Nợ`, chọn `Cho vay`, nhập 500k cho "Bạn A" -> Ví bị trừ 500k, Sổ nợ ghi nhận "Bạn A nợ 500k".
- [ ] Bấm `+ Ghi chép`, chọn `Thu nợ`, chọn khoản của "Bạn A", nhập thu 500k vào ví -> Ví được cộng 500k, khoản nợ chuyển sang trạng thái "Đã hoàn tất".
