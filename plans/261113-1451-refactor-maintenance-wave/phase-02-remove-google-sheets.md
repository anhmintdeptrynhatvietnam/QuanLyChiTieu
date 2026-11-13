---
phase: 2
title: "Gỡ Google Sheets"
status: pending
priority: P1
effort: "0.5d"
dependencies: [1]
---

# Phase 02: Gỡ Google Sheets

## Overview
Xoá toàn bộ tích hợp Google Sheets (GIS OAuth + Sheets API + sync modal). Firebase là cloud duy nhất. Giữ export/import JSON/CSV.

## Requirements
- Functional: app chạy bình thường không có Sheets; badge đồng bộ ở header chỉ phản ánh Firebase và mở trang Cài đặt (không còn sync modal).
- Functional: dọn dữ liệu cũ trong localStorage: `quanlythuchi_google_access_token`, `quanlythuchi_google_token_expires_at`; bỏ `googleClientId`, `spreadsheetId`, `spreadsheetName`, `autoSync`, `lastSyncTime` khỏi settings khi load.
- KHÔNG đụng: Firebase Google sign-in (`firebase-auth.js`), Google Fonts, bypass `googleapis.com` trong `sw.js` (Firestore/Firebase Auth cũng dùng `*.googleapis.com`).

## Architecture
- Settings migration nhỏ trong `state.js` constructor: `sanitizeLegacySettings(settings)` xoá key Sheets; đặt trong `js/domain/settings-migration.js` (thuần, có test).
- `syncStatus` trong state: bỏ nếu chỉ phục vụ Sheets (kiểm tra `setSyncStatus` còn ai gọi sau khi gỡ).

## Related Code Files
- Delete: `js/services/google-auth.js`, `js/services/google-sheets.js`, `js/components/sync-modal.js`
- Create: `js/domain/settings-migration.js`, `tests/settings-migration.test.mjs`
- Modify: `index.html` (bỏ `<script src="https://accounts.google.com/gsi/client">` dòng 37, text "Local & Google Sheets" dòng 49, aria/title badge dòng 101-103, meta description dòng 7), `js/app.js` (dòng 13, 69-75, 162-163, 185-208), `js/components/settings.js` (khối Google Sheets ~58 tham chiếu, khối Pull đang comment 214-219, 662-682), `js/config.js` (`DEFAULT_SETTINGS`), `js/state.js` (`syncStatus` message dòng 21), `manifest.json` (description), `sw.js` (bỏ 3 file khỏi `ASSETS_TO_CACHE`, bump `CACHE_NAME`)

## Implementation Steps
1. Test `sanitizeLegacySettings` (có/không có key cũ, không làm mất key khác).
2. Xoá 3 file, gỡ import và UI liên quan.
3. Badge header: chỉ hiển thị trạng thái Firebase (`firebaseSyncService.onStatusChange`), click → chuyển view settings.
4. Dọn localStorage key token Google khi khởi động (try/catch).
5. Cập nhật `sw.js`, `manifest.json`, meta.

## Success Criteria
- [ ] `grep -rniE "google-sheets|google-auth|sync-modal|gsi/client|googleClientId|spreadsheet" js index.html sw.js` không còn kết quả.
- [ ] `node --test "tests/*.test.mjs"` xanh.
- [ ] Console không lỗi khi mở app; trang Cài đặt hiển thị đủ phần Firebase, danh mục, dữ liệu.
- [ ] Smoke test bước 4, 5, 7 pass.

## Risk Assessment
- `window.syncModal` được tạo trong `settings.js:17` và dùng ở `app.js:162` → xoá cả hai đầu, nếu sót sẽ có lỗi `undefined` khi bấm badge (signal: lỗi console khi click badge).
- Người dùng đang có dữ liệu chỉ trên Sheets (chưa có trên Firebase/local) sẽ không kéo về được nữa. Pull Sheets đã bị tắt từ trước nên [Inference] rủi ro thấp; ghi vào changelog.
