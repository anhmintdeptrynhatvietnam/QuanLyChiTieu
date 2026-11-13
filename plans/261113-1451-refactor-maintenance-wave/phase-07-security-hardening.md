---
phase: 7
title: "Bảo mật & riêng tư"
status: pending
priority: P2
effort: "0.5d"
dependencies: [2]
---

# Phase 07: Bảo mật & riêng tư

## Overview
Vá XSS ở toast, bớt PII trong file backup, sửa CSV injection, thêm CSP.

## Requirements
- BUG-08: `toast.js` render `message` bằng `textContent` (giữ icon bằng element tạo riêng). Rà mọi `innerHTML` có chèn dữ liệu ngoài (`user.displayName`, `err.message`, tên ví/hạng mục/người vay) → phải qua `escapeHtml` hoặc `textContent`.
- Export JSON: bỏ `settings.firebaseUser`, `syncStatus`; giữ `firebaseConfig` chỉ khi khác `DEFAULT_FIREBASE_CONFIG`. Import: bỏ qua các key đó nếu có trong file cũ.
- ADD-07 CSV: escape `"` cho mọi ô chuỗi; ô bắt đầu bằng `=`, `+`, `-`, `@`, tab, CR → thêm tiền tố `'`.
- CSP qua `<meta http-equiv="Content-Security-Policy">`: `default-src 'self'`; `script-src` chỉ self + CDN đã pin (unpkg, jsdelivr, gstatic); `connect-src` self + `*.googleapis.com` + `*.firebaseio.com` + `wss://*.firebaseio.com` + `securetoken.googleapis.com`; `frame-src` `*.firebaseapp.com` (popup/redirect Google sign-in); `style-src` self + `'unsafe-inline'` (code đang dùng inline style rất nhiều) + fonts.googleapis.com; `font-src` fonts.gstatic.com; `img-src` self data: `*.googleusercontent.com` (avatar).
- SRI: thêm `integrity` + `crossorigin` cho script CDN đã pin (lucide, chart.js). Firebase ESM import không hỗ trợ SRI qua `import()` → ghi nhận giới hạn.

## Architecture
- `js/domain/export-sanitize.js` (thuần): `sanitizeForExport(state)`, `toCsvCell(value)`; có test.

## Related Code Files
- Create: `js/domain/export-sanitize.js`, `tests/export-sanitize.test.mjs`
- Modify: `js/components/toast.js`, `js/services/export-import.js`, `js/state.js` (`importAllData` bỏ key nhạy cảm), `index.html` (CSP, SRI), các component có `innerHTML` chưa escape, `sw.js`

## Implementation Steps
1. Test sanitize + CSV cell (red) → viết domain (green).
2. Sửa toast; grep `innerHTML` toàn `js/` và đánh dấu từng chỗ chèn dữ liệu động.
3. Thêm CSP ở chế độ thử: bật, mở app, làm smoke test đầy đủ, đọc lỗi CSP trong console, nới đúng chỗ.
4. Tính hash SRI cho 2 script CDN (tải file bản đã pin, `openssl dgst -sha384 -binary | openssl base64 -A`).

## Success Criteria
- [ ] `node --test "tests/*.test.mjs"` xanh.
- [ ] Toast với message `<img src=x onerror=alert(1)>` hiển thị đúng chữ, không chạy script.
- [ ] File JSON export không chứa `firebaseUser`.
- [ ] Smoke test đầy đủ không có lỗi CSP trong console, kể cả đăng nhập Google qua Firebase.

## Risk Assessment
- CSP quá chặt chặn Firebase Auth popup → signal: lỗi `Refused to frame/connect` khi đăng nhập → thêm đúng domain bị chặn, không dùng `*`.
- `'unsafe-inline'` cho style làm CSP yếu hơn → chấp nhận; bỏ inline style là việc của phase 08.
