---
phase: 5
title: "Migration cloud cũ + đổi tài khoản"
status: completed
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
- [x] `node --test "tests/*.test.mjs"` xanh.
- [x] Tài khoản có dữ liệu cũ → sau đăng nhập thấy đủ dữ liệu, số bản ghi khớp, doc cũ vẫn còn.
- [x] Đổi A → B không còn dữ liệu A trong state hay trên cloud của B.
- [x] Nút push/pull all hoạt động.

## Risk Assessment
- Mất dữ liệu nếu migration ghi `meta/schema` khi batch lỗi → chỉ ghi sau khi mọi batch thành công; có backup JSON tự động.
- Hai thiết bị cùng migrate một lúc → ghi theo `id` cố định nên kết quả giống nhau [Inference]; chấp nhận.
- Thiết bị cũ (chưa cập nhật code, SW cache bản cũ) vẫn ghi vào `users/{uid}/data/*` sau migration → dữ liệu mới từ thiết bị cũ không sang schema mới. Signal: người dùng báo thiếu giao dịch từ thiết bị khác → bump `CACHE_NAME` để ép cập nhật; ghi hướng dẫn "reload các thiết bị" vào changelog.

## Kết quả (2026-11-13)
- Code: `js/domain/legacy-migration.js`, `js/domain/account-switch.js` (thuần, có test), `js/services/firebase-migration.js` (đọc `meta/schema` + `data/*`, ghi batch theo id, ghi `meta/schema` sau cùng, không xoá `data/*`), `js/services/cloud-session.js` (điều phối trước `startSync`). `state.js` chờ UI do `app.js` đăng ký (`setCloudSessionUi`) rồi mới xử lý đăng nhập; bỏ khối hỏi upload trong `settings.js`; khôi phục nút đẩy/kéo toàn bộ (chỉ hiện khi đã kết nối).
- Quyết định đăng nhập: uid khác lần trước → thay local (cloud có dữ liệu → rỗng; cloud trống → mặc định); lần đầu + cả hai có dữ liệu → hỏi "Dùng dữ liệu Cloud" (tự backup JSON) / "Ghi đè Cloud" / "Gộp cả hai" (đóng hộp thoại = gộp, không phá huỷ).
- Lỗi tự phát hiện khi viết: thay local mà giữ baseline cũ của uid → engine coi là xoá hết → xoá cloud. Sửa: `firebaseSyncService.clearBaseline(uid)` mỗi lần thay local.
- Sửa thêm: nút kéo toàn bộ khi cloud trống không còn xoá ví/hạng mục trên máy.
- Đã kiểm: 109 test xanh; browser chưa đăng nhập: không lỗi, UI đã đăng ký, nút ẩn đúng.
- Kiểm cloud thật 2026-11-14 (tài khoản Google của chủ dự án, dữ liệu test có tiền tố CLOUD-TEST/LEGACY-TEST/IMPORT-TEST):
- Đã biết: Import JSON khi đang đồng bộ = khôi phục cả cloud về bản backup (bản ghi cloud không có trong file sẽ bị xoá).
  - Cloud trống → ghi `meta/schema v2` → đẩy local lên: đạt.
  - Thêm/sửa/xoá → doc Firestore cập nhật ≤4s; sửa 2 bảng liền nhau (budget + category) → cả 2 lên cloud: đạt.
  - 2 tab thấy thay đổi của nhau, 2 chiều: đạt.
  - Rules: đọc/ghi uid khác, đọc collection gốc → `permission-denied`: đạt.
  - Migration `data/*` (trùng id + thiếu id): giữ bản mới hơn, bỏ bản thiếu id, stats đúng, doc cũ còn, chạy lại cho cùng kết quả: đạt.
  - Đổi tài khoản (giả lập `qlct_last_auth_uid` khác): dữ liệu local-only của "A" bị bỏ, không lên cloud; cloud không mất bản ghi nào: đạt.
  - Import JSON → cloud xoá/thêm đúng theo file: đạt. Nút đẩy/kéo toàn bộ: đạt.
- Lỗi phát hiện khi test thật, đã sửa: Firestore trả doc theo id nên sau khi kéo từ cloud (máy mới, đổi tài khoản, "Dùng dữ liệu Cloud", nút kéo toàn bộ) ví/hạng mục bị xếp lại theo ABC, giao dịch không theo ngày ở đường kéo toàn bộ. Sửa: `sortCollectionRecords` + `compareCreationOrder` trong `sync-diff.js` (mặc định theo thứ tự config, rồi `createdAt` tăng dần), dùng cho cả merge và `pullAllData`; +2 test (111 xanh).
- Sửa thêm: đăng nhập ẩn danh khi project chưa bật Anonymous → thông báo tiếng Việt chỉ chỗ bật.
- Chưa kiểm: đổi sang tài khoản Google thứ hai thật; ngắt mạng giữa migration (idempotent đã kiểm bằng chạy lại).
