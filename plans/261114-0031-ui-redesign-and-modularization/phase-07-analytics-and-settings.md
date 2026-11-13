---
phase: 7
title: "Báo cáo · Cài đặt"
status: pending
dependencies: [1, 2]
---

# Phase 07: Báo cáo · Cài đặt

## Requirements
- Báo cáo: chọn tháng; biểu đồ tròn cơ cấu chi (Chart.js, màu theo token theme, vẽ lại khi đổi theme); biểu đồ cột thu/chi 6 tháng; bảng xếp hạng hạng mục.
- Cài đặt chia nhóm: Tài khoản & Cloud (đăng nhập Google/ẩn danh, trạng thái, đẩy/kéo toàn bộ, đăng xuất, cấu hình Firebase riêng), Giao diện (Sáng/Tối/Theo hệ thống, che số), Hạng mục (thêm/sửa/xoá), Dữ liệu (xuất JSON/CSV, nhập JSON, xoá toàn bộ — giữ confirm gõ chữ).
- Mỗi nhóm 1 module < 200 dòng.

## Files
- Create: `js/views/analytics/*.js`, `js/views/settings/*.js`. Delete: `js/components/analytics.js`, `settings.js`. `sw.js`.

## Success Criteria
- [ ] Mọi chức năng cài đặt cũ còn đủ; biểu đồ đúng màu ở cả 2 theme.
