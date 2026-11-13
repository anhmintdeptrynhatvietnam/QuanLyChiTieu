---
phase: 5
title: "Danh sách giao dịch"
status: completed
dependencies: [3]
---

# Phase 05: Danh sách giao dịch

## Requirements
- Nhóm theo ngày (tiêu đề `Thứ X, DD/MM/YYYY` + tổng thu/chi ngày), dùng `js/ui/transaction-row.js`.
- Ô tìm kiếm (ghi chú, tên hạng mục, tên ví; không phân biệt dấu tiếng Việt) + chip lọc: thời gian (Tháng này/Hôm nay/Tuần này/Tháng trước/Tất cả), loại (Chi/Thu/Chuyển), hạng mục, ví.
- Chạm dòng → mở sheet sửa (phase 03). Bỏ nút sửa/xoá nhỏ trên từng dòng.
- Danh sách dài: render theo trang 50 dòng + "Xem thêm".
- Lọc/tìm/nhóm thuần trong `js/domain/transaction-query.js` + test (gồm bỏ dấu tiếng Việt).

## Files
- Create: `js/views/transactions/*.js`, `js/domain/transaction-query.js` (+ test). Delete: `js/components/transaction-list.js`. `sw.js`.

## Success Criteria
- [ ] Kết quả lọc khớp màn hình cũ với cùng bộ lọc; tìm "an uong" ra "Ăn uống".
