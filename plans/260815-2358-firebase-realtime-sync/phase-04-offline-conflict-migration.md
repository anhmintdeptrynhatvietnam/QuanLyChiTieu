---
phase: 4
title: "Offline Cache, Conflict Handling & Testing"
status: pending
priority: P1
effort: "2.5h"
dependencies: ["2", "3"]
---

# Phase 04: Offline Cache, Conflict Handling & Testing

## Overview
Đảm bảo tính năng hoạt động mượt mà khi mất kết nối mạng (Local-First), giải quyết xung đột khi ghi dữ liệu đồng thời từ nhiều thiết bị và kiểm thử toàn diện kịch bản đồng bộ.

## Requirements
- Functional:
  - Bật chế độ `enableIndexedDbPersistence()` / `persistentLocalCache` của Firebase Firestore SDK.
  - Khi thiết bị offline: ghi nhận giao dịch vào Local DB tức thì, hiển thị ngay trên UI.
  - Khi thiết bị online trở lại: tự động đẩy hàng đợi thay đổi lên Firestore và cập nhật dữ liệu mới nhất từ cloud.
  - Xung đột đồng thời: Áp dụng chiến lược Last-Write-Wins dựa trên trường `updatedAt` của từng bản ghi.
  - Migration Tool: Hỗ trợ nút "Đẩy dữ liệu máy hiện tại lên Firebase" trong lần đầu đăng nhập.
- Non-functional:
  - Cập nhật PWA Cache Name trong `sw.js` lên `qlct-pwa-v2.0` để người dùng không bị kẹt cache cũ.

## Related Code Files
- Modify: `js/services/firebase-sync.js`
- Modify: `sw.js`
- Modify: `docs/system-architecture.md` (nếu cần cập nhật tài liệu)

## Implementation Steps
1. Cấu hình offline persistence cho Firestore SDK.
2. Viết hàm kiểm tra và upload dữ liệu cục bộ ban đầu (Initial Migration).
3. Test kịch bản Offline -> Tạo giao dịch -> Bật mạng -> Kiểm tra dữ liệu tự sync sang thiết bị khác.
4. Nâng version `CACHE_NAME` trong `sw.js`.

## Success Criteria
- [ ] Ứng dụng vẫn hoạt động 100% khi mất mạng (DevTools Network: Offline).
- [ ] Khi có mạng lại, dữ liệu offline tự động đồng bộ lên Firebase và xuất hiện ở máy thứ 2 mà không gây lỗi hoặc mất dữ liệu.
