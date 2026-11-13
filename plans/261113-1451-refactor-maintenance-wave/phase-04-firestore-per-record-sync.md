---
phase: 4
title: "Firestore 1 doc/bản ghi + sync engine mới + rules"
status: pending
priority: P1
effort: "1.5d"
dependencies: [1, 2]
---

# Phase 04: Firestore 1 doc/bản ghi + sync engine mới + rules

## Overview
Viết lại `firebase-sync.js` theo mô hình 1 document/bản ghi, đẩy lên bằng diff thay vì theo tên event. Sửa cùng lúc BUG-01, BUG-02, BUG-03, BUG-04, ADD-02, ADD-03 (ở mức bản ghi). Thêm `firestore.rules`.

## Requirements
- Schema mới:
  - `users/{uid}/transactions/{id}`, `users/{uid}/wallets/{id}`, `users/{uid}/categories/{id}`, `users/{uid}/budgets/{id}`, `users/{uid}/debts/{id}` (repayments nhúng trong debt).
  - `users/{uid}/meta/settings` (chỉ `currency`, `currencySymbol`, `theme`), `users/{uid}/meta/schema` (`{ version: 2 }`).
  - Mỗi doc = bản ghi + `_updatedAt` (`serverTimestamp()`).
  - Không lưu `currentBalance` lên cloud (giá trị suy ra).
- Đẩy lên: sau mỗi `notify()`, engine so sánh state hiện tại với baseline (bản ghi đã đồng bộ gần nhất, map `id → JSON`) cho TẤT CẢ collection, ghi các doc thêm/sửa và `deleteDoc` các doc bị xoá bằng `writeBatch` (≤ 500 thao tác/batch, chia nhiều batch nếu cần). Debounce một timer chung là an toàn vì diff luôn quét mọi bảng.
- Nhận về: `onSnapshot` từng collection; bỏ qua change có `metadata.hasPendingWrites`; áp `docChanges()` (added/modified/removed) vào state theo bản ghi, cập nhật baseline để không đẩy lại. Bỏ cơ chế `_lastDeviceId`/`qlct_device_id` (sửa multi-tab).
- `data:imported` tự được đẩy nhờ diff (BUG-03); xoá category kéo theo budgets tự được đẩy (BUG-04).
- Firebase SDK nạp bằng dynamic `import()` bên trong service (chuẩn bị cho phase 06; `state.js` không còn phụ thuộc tĩnh vào URL CDN).
- `firestore.rules`:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{uid}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
  ```

## Architecture
- `js/domain/sync-diff.js` (thuần): `diffCollections(baseline, current) → { upserts: [{collection, id, data}], deletes: [{collection, id}] }`, `applyRemoteChanges(stateSlice, changes)`, `stripDerivedFields(record)`.
- `js/services/firebase-sync.js`: chỉ I/O Firestore (listeners, batch write), gọi domain.
- `state.js`: gọi `firebaseSyncService.scheduleSync(this.state)` cho mọi event mutate (không còn bảng tra theo prefix event); `applyRemoteState` nhận thay đổi theo bản ghi.

## Related Code Files
- Create: `js/domain/sync-diff.js`, `tests/sync-diff.test.mjs`, `firestore.rules`
- Modify: `js/services/firebase-sync.js` (viết lại), `js/services/firebase-auth.js` (dynamic import), `js/state.js` (`notify`, `applyRemoteState`, `initFirebase`), `js/components/settings.js` (trạng thái sync), `sw.js` (thêm file mới, bump cache)

## Implementation Steps
1. Test `diffCollections`: thêm/sửa/xoá, nhiều bảng cùng lúc, bỏ qua `currentBalance`, baseline rỗng.
2. Test `applyRemoteChanges`: added/modified/removed, thứ tự transactions (mới nhất trước như `unshift` hiện tại → sắp theo `date` desc, `createdAt` desc).
3. Viết domain, rồi viết lại service.
4. Đổi `state.js` sang API mới; giữ debounce ~400ms.
5. Viết `firestore.rules`; Claude review rules (security-sensitive). User tự deploy: Firebase Console → Firestore → Rules, hoặc `firebase deploy --only firestore:rules`.
6. Thử trên tài khoản ẩn danh mới (chưa có dữ liệu cũ): smoke test bước 4, 5.

## Success Criteria
- [ ] `node --test "tests/*.test.mjs"` xanh.
- [ ] Sửa 2 bảng trong < 400ms → cả 2 lên cloud (kiểm tra Firestore Console).
- [ ] 2 tab cùng trình duyệt thấy thay đổi của nhau.
- [ ] Import JSON → cloud cập nhật đúng.
- [ ] Không còn đọc/ghi `users/{uid}/data/*` ngoài code migration của phase 05.

## Risk Assessment
- Phase này làm app KHÔNG đọc được dữ liệu cloud cũ cho tới khi phase 05 xong → không deploy riêng phase 04; 04 và 05 phải lên cùng lúc.
- Rules chưa deploy mà code chạy → nếu rules hiện tại trên server chỉ cho `users/{uid}/data/*`, ghi sẽ bị `permission-denied`. Signal: lỗi `permission-denied` trong console → deploy rules mới trước khi test.
- Sắp thứ tự transactions có thể khác thứ tự `unshift` cũ → kiểm tra danh sách giao dịch và dashboard "gần đây".
- Chi phí đọc: mỗi lần mở app đọc toàn bộ collection (một lần, sau đó cache IndexedDB của Firestore). Chấp nhận với quy mô cá nhân.
