---
phase: 2
title: "Giao diện Sổ Vay & Nợ (Debts Component)"
status: pending
priority: P1
effort: "45m"
dependencies: [1]
---

# Phase 02: Giao diện Sổ Vay & Nợ (Debts Component)

## Overview
Xây dựng màn hình độc lập **Sổ Vay & Nợ** (`js/components/debts.js`) hiển thị tổng hợp số tiền đang cho vay / đang đi vay, bộ lọc thông minh, danh sách chi tiết các khoản nợ, cùng 2 modal: Modal Tạo Khoản Vay/Nợ Mới và Modal Thu Nợ / Trả Nợ (hỗ trợ trả góp nhiều lần).

## Requirements
- **Functional**:
  - Thẻ tóm tắt tổng quan:
    - 💰 **Họ đang nợ tôi**: Tổng `remainingAmount` của tất cả các khoản `lend` chưa trả xong.
    - 💳 **Tôi đang nợ họ**: Tổng `remainingAmount` của tất cả các khoản `borrow` chưa trả xong.
  - Thanh bộ lọc nhanh: *Tất cả*, *Cho vay (Người khác nợ)*, *Đi vay (Tôi nợ)*, *Chưa thanh toán xong*, *Đã hoàn tất*.
  - Thẻ từng khoản nợ:
    - Badge loại: `Cho vay` (màu xanh dương/xanh lá) hoặc `Đi vay` (màu cam/tím).
    - Tên người liên quan, số tiền gốc ban đầu, số tiền còn lại chưa trả.
    - Thanh tiến độ (Progress bar) % đã thanh toán.
    - Ngày tạo, ngày hẹn trả (nếu có, đổi màu cảnh báo nếu quá hạn).
    - Nút hành động nhanh: **"Thu nợ"** (với khoản cho vay) hoặc **"Trả nợ"** (với khoản đi vay), nút Sửa, nút Xóa.
    - Lịch sử các lần trả nợ chi tiết (ngày, số tiền, ví nhận/trả, ghi chú).
  - Modal Thêm Khoản Vay/Nợ Mới: Form nhập Người vay, loại (Cho vay/Đi vay), số tiền, ví nguồn/đích, ngày hẹn trả, ghi chú.
  - Modal Thu Nợ / Trả Nợ: Cho phép nhập số tiền trả (gợi ý sẵn số tiền còn lại để trả hết hoặc nhập số nhỏ hơn để trả một phần), chọn ví nhận/trả tiền, ngày giao dịch, ghi chú.
  - Điều hướng: Thêm mục `Sổ Vay & Nợ` vào thanh Sidebar và Mobile nav trong `index.html` và `js/app.js`.

## Related Code Files
- Create: `js/components/debts.js`
- Modify: `index.html`
- Modify: `js/app.js`

## Implementation Steps
1. Trong `index.html`:
   - Thêm nút nav `data-view="debts"` với icon `hand-coins` hoặc `receipt-text` trên Sidebar và Mobile Nav.
   - Thêm container `<section id="view-debts" class="view-section"></section>`.
2. Tạo file `js/components/debts.js`:
   - Lớp `Debts` subscribe vào `stateStore`.
   - Render header stats, filter buttons, debts grid list, và các modal.
   - Xử lý các sự kiện click, filter, form submit tạo nợ mới và ghi nhận trả nợ.
3. Trong `js/app.js`:
   - Import `Debts` từ `./components/debts.js`.
   - Khởi tạo `this.debts = new Debts('view-debts')`.
   - Thêm title `debts: 'Sổ Vay & Nợ'`.

## Success Criteria
- [ ] Truy cập được vào màn hình "Sổ Vay & Nợ" từ menu điều hướng.
- [ ] Thêm được một khoản Cho vay hoặc Đi vay thành công.
- [ ] Bấm nút "Thu nợ" / "Trả nợ", chọn trả một phần -> cập nhật đúng số tiền còn lại và lịch sử trả nợ.
- [ ] Bộ lọc lọc chính xác theo trạng thái và chiều vay/nợ.
