---
phase: 5
title: "Migration cloud cũ + đổi tài khoản"
status: pending
priority: P1
effort: "1d"
dependencies: [4]
---

# Phase 05: Migration cloud cũ + đổi tài khoản

## Overview
Chuyển dữ liệu từ schema cũ (`users/{uid}/data/{table}` chứa mảng `items`) sang schema mới, và sửa logic đăng nhập/đổi tài khoản (ADD-04). Thực thi: Claude trực tiếp (thao tác dữ liệu thật).

## Requirements
- Khi đăng nhập: đọc `users/{uid}/meta/schema`.
  - `version: 2` → chạy bình thường.
  - Chưa có + tồn tại `users/{uid}/data/transactions` (hoặc bảng khác) → migration.
  - Chưa có + không có dữ liệu cũ → ghi `version: 2`, rồi xử lý theo luật "lần đăng nhập đầu" dưới đây.
- Migration:
  1. Hỏi người dùng (confirm dialog) và tự export JSON backup trước khi chạy.
  2. Đọc 6 doc cũ, chuyển `items[]` → doc theo `id` bằng batch; bỏ bản ghi thiếu `id` hoặc trùng `id` (giữ bản có `updatedAt` mới hơn), ghi log số lượng.
  3. Ghi `meta/schema = { version: 2, migratedAt, migratedFrom: 'data-arrays' }` SAU khi mọi batch thành công.
  4. KHÔNG xoá `users/{uid}/data/*` (giữ để rollback). Dọn dẹp là việc sau, ngoài plan này.
  5. Idempotent: chạy lại khi bị ngắt giữa chừng cho ra cùng kết quả (ghi theo `id` cố định).
- Đổi tài khoản / lần đầu:
  - uid khác `qlct_last_auth_uid` → xoá state local về mặc định TRƯỚC khi gắn listener (sửa lẫn dữ liệu A sang B).
  - Lần đăng nhập đầu tiên trên máy (không có `qlct_last_auth_uid`) và local có dữ liệu: cloud rỗng → đẩy local lên; cloud có dữ liệu → hỏi "Dùng dữ liệu Cloud" / "Ghi đè Cloud bằng dữ liệu máy này".
- Khôi phục nút "Đẩy toàn bộ lên Cloud" / "Kéo toàn bộ từ Cloud" trong Cài đặt (hiện là code chết BUG-07), dùng API mới.

## Architecture
- `js/domain/legacy-migration.js` (thuần): `mapLegacyTables(legacyDocs) → { [collection]: Record[] }` + `dedupeById`.
- `js/services/firebase-migration.js`: I/O đọc doc cũ, ghi batch, ghi `meta/schema`.
- `js/domain/account-switch.js` (thuần): `decideOnSignIn({ lastUid, uid, localHasData, cloudHasData }) → 'reset-local' | 'push-local' | 'ask-user' | 'use-cloud'`.

## Related Code Files
- Create: `js/domain/legacy-migration.js`, `js/domain/account-switch.js`, `js/services/firebase-migration.js`, `tests/legacy-migration.test.mjs`, `tests/account-switch.test.mjs`
- Modify: `js/state.js` (`initFirebase` dòng 28-63), `js/components/settings.js` (nút push/pull all), `js/services/export-import.js` (gọi export tự động trước migration), `sw.js`

## Implementation Steps
1. Test mapping: dữ liệu mẫu theo đúng shape cũ (`{ items, _lastDeviceId, updatedAt }`), trùng id, thiếu id, settings object.
2. Test bảng quyết định đăng nhập (mọi tổ hợp).
3. Viết domain → service → nối vào `state.js`.
4. Thử: (a) tài khoản ẩn danh mới; (b) tài khoản có dữ liệu cũ — tạo bằng code trước phase 04 (checkout commit cũ, nhập dữ liệu, đăng nhập) rồi chạy code mới; (c) ngắt mạng giữa migration rồi chạy lại.
5. So sánh số bản ghi trước/sau trên Firestore Console.

## Success Criteria
- [ ] `node --test "tests/*.test.mjs"` xanh.
- [ ] Tài khoản có dữ liệu cũ → sau đăng nhập thấy đủ dữ liệu, số bản ghi khớp, doc cũ vẫn còn.
- [ ] Đổi A → B không còn dữ liệu A trong state hay trên cloud của B.
- [ ] Nút push/pull all hoạt động.

## Risk Assessment
- Mất dữ liệu nếu migration ghi `meta/schema` khi batch lỗi → chỉ ghi sau khi mọi batch thành công; có backup JSON tự động.
- Hai thiết bị cùng migrate một lúc → ghi theo `id` cố định nên kết quả giống nhau [Inference]; chấp nhận.
- Thiết bị cũ (chưa cập nhật code, SW cache bản cũ) vẫn ghi vào `users/{uid}/data/*` sau migration → dữ liệu mới từ thiết bị cũ không sang schema mới. Signal: người dùng báo thiếu giao dịch từ thiết bị khác → bump `CACHE_NAME` để ép cập nhật; ghi hướng dẫn "reload các thiết bị" vào changelog.
