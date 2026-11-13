---
phase: 4
title: "Tổng quan"
status: pending
dependencies: [2]
---

# Phase 04: Tổng quan

## Requirements
- Thẻ lớn: Tổng tài sản (che số được), dưới là Thu / Chi tháng này và chênh lệch.
- Cảnh báo ngân sách: các hạng mục ≥ 80% hạn mức tháng (thanh tiến độ), tối đa 3, link sang Ngân sách.
- Vay/Nợ: 1 dòng tóm tắt (đang cho vay / đang nợ) nếu có.
- Giao dịch gần đây: 5–10 dòng nhóm theo ngày (dùng chung component dòng giao dịch với phase 05), "Xem tất cả".
- Trạng thái trống: hướng dẫn bấm [+] để ghi khoản đầu tiên.
- Tính toán thuần (tổng tháng, ngân sách sắp vượt, nhóm theo ngày) đặt trong `js/domain/` + test.

## Files
- Create: `js/views/dashboard/*.js`, `js/ui/transaction-row.js`, `js/domain/period-summary.js` (+ test). Delete: `js/components/dashboard.js`. `sw.js`.

## Success Criteria
- [ ] Số liệu khớp màn hình cũ trên cùng dữ liệu; che số vẫn hoạt động.
