---
phase: 3
title: "UI Settings & Realtime Status Indicator"
status: pending
priority: P2
effort: "2h"
dependencies: ["1", "2"]
---

# Phase 03: UI Settings & Realtime Status Indicator

## Overview
Xây dựng giao diện cấu hình Firebase trong trang Cài đặt (Settings View) và hiển thị chỉ báo trạng thái kết nối Realtime (Live Status Badge) trực quan trên Sidebar/Header.

## Requirements
- Functional:
  - Settings View: Thêm Card "Đồng bộ Đám mây Realtime (Firebase)".
  - Nút Đăng nhập Google / Đăng xuất với Avatar, Tên và Email hiển thị rõ ràng.
  - Trường cấu hình Firebase Config (JSON / API Key / Project ID) cho người dùng muốn dùng Firebase cá nhân.
  - Live Status Indicator:
    - 🟢 Xanh lá: *Realtime Sync Active* (Đã kết nối cloud).
    - 🟡 Vàng: *Đang đồng bộ / Đang kết nối lại*.
    - 🔴 Xám/Đỏ: *Offline (Lưu cục bộ trên thiết bị)*.
- Non-functional:
  - Giao diện đẹp, hiện đại, responsive trên cả Mobile và Desktop theo chuẩn CSS variables hiện có.

## Related Code Files
- Modify: `js/components/settings.js`
- Modify: `js/app.js`
- Modify: `index.html`
- Modify: `css/components.css`

## Implementation Steps
1. Bổ sung HTML/CSS cho Live Status Badge ở góc trên hoặc thanh sidebar.
2. Thêm Form cấu hình Firebase và bảng điều khiển Account trong `js/components/settings.js`.
3. Gắn listener cập nhật trạng thái kết nối mạng (`window.addEventListener('online')`, `window.addEventListener('offline')`).

## Success Criteria
- [ ] Người dùng thấy rõ mình đang ở chế độ Realtime hay Offline.
- [ ] Dễ dàng đăng nhập / đăng xuất hoặc đổi cấu hình Firebase ngay trong Cài đặt.
