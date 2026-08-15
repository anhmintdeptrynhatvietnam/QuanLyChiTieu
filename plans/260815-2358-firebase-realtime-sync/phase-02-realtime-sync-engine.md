---
phase: 2
title: "Firestore Realtime Sync Engine"
status: pending
priority: P1
effort: "3h"
dependencies: ["1"]
---

# Phase 02: Firestore Realtime Sync Engine

## Overview
Xây dựng engine đồng bộ realtime hai chiều `firebase-sync.js` kết nối Firestore Database và `StateStore`. Lắng nghe mọi thay đổi trên cloud theo thời gian thực qua `onSnapshot()` và tự động đẩy các thay đổi cục bộ lên Firestore theo từng document hoặc batch.

## Requirements
- Functional:
  - Cấu trúc Firestore:
    - `users/{userId}/transactions/{txId}`
    - `users/{userId}/wallets/{walletId}`
    - `users/{userId}/categories/{catId}`
    - `users/{userId}/budgets/{budgetId}`
    - `users/{userId}/debts/{debtId}`
    - `users/{userId}/metadata/settings`
  - Realtime Listeners: Khởi tạo `onSnapshot` cho từng collection của user.
  - Phân biệt Local vs Remote change (`snapshot.metadata.hasPendingWrites`) để tránh vòng lặp echo (echo-loop).
  - Tự động gọi `recalculateWalletBalances()` khi nhận được giao dịch / ví mới từ thiết bị khác.
- Non-functional:
  - Độ trễ phản hồi < 100ms khi có mạng.
  - Debounce nhẹ cho batch push để tối ưu số lượt ghi Firestore.

## Architecture
- `js/services/firebase-sync.js`:
  - `startRealtimeListener(userId, onUpdateCallback)`
  - `stopRealtimeListener()`
  - `pushEntity(collectionName, entityId, data)`
  - `deleteEntity(collectionName, entityId)`
  - `pushFullState(state)` (cho lần đầu sync hoặc migration)

## Related Code Files
- Create: `js/services/firebase-sync.js`
- Modify: `js/state.js`, `sw.js`

## Implementation Steps
1. Tạo `js/services/firebase-sync.js` import Firestore SDK (`getFirestore`, `collection`, `doc`, `onSnapshot`, `setDoc`, `deleteDoc`).
2. Tích hợp hook vào `StateStore.notify()`: nếu Firebase đã kết nối, đẩy thay đổi của entity lên Firestore tương ứng.
3. Trong `onSnapshot`, cập nhật `stateStore.state` với dữ liệu mới từ Firestore mà không gọi lại push (remote apply).
4. Cập nhật `sw.js` thêm `firebase-sync.js`.

## Success Criteria
- [ ] Mở 2 tab trình duyệt: Thêm 1 giao dịch ở Tab A -> Tab B xuất hiện giao dịch ngay lập tức mà không cần reload.
- [ ] Sửa số dư ví hoặc khoản nợ ở Tab B -> Tab A tự động tính toán lại số dư tương ứng.
