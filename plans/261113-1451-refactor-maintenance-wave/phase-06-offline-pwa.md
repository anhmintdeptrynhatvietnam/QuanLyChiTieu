---
phase: 6
title: "Offline/PWA"
status: completed
priority: P2
effort: "0.5d"
dependencies: [4]
---

# Phase 06: Offline/PWA

## Overview
App phải mở được offline sau lần online đầu: precache đủ file local, cache CDN đã pin version, và lỗi tải Firebase không làm sập app (ADD-01, BUG-11).

## Requirements
- Mọi file `js/**/*.js`, `css/*.css`, icon trong `ASSETS_TO_CACHE`; bump `CACHE_NAME`.
- Pin version CDN: `lucide@<version>` thay `@latest`, `chart.js@<version>` (chọn bản đang chạy ổn, ghi rõ version), Firebase giữ `10.13.0`.
- Fetch handler: cache response cross-origin `cors` 200 từ allowlist host (`unpkg.com`, `cdn.jsdelivr.net`, `www.gstatic.com`, `fonts.googleapis.com`, `fonts.gstatic.com`) theo stale-while-revalidate; vẫn bỏ qua `*.googleapis.com` API (Firestore/Auth) trừ fonts.
- Firebase load thất bại (offline lần đầu, CDN lỗi) → app vẫn chạy local-only, badge báo "Offline / chưa tải được Cloud", không lỗi đỏ chặn render.
- Kiểm tra trùng lặp: `privacy.js` và các file mới của phase 01-05 có trong danh sách.

## Architecture
- Thêm guard đơn giản trong `sw.js`: danh sách `ASSETS_TO_CACHE` viết tay (giữ kiểu hiện tại), cộng một test Node `tests/sw-assets.test.mjs` đọc `sw.js` + liệt kê `js/`, `css/` và báo file thiếu → chặn tái phát BUG-11.

## Related Code Files
- Modify: `sw.js`, `index.html` (dòng 35-36), `js/services/firebase-auth.js`, `js/services/firebase-sync.js` (bắt lỗi dynamic import), `js/state.js` (`initFirebase` không throw)
- Create: `tests/sw-assets.test.mjs`

## Implementation Steps
1. Viết `tests/sw-assets.test.mjs` (so `ASSETS_TO_CACHE` với file thật trong `js/`, `css/`).
2. Cập nhật danh sách + `CACHE_NAME`.
3. Pin version CDN, sửa fetch handler.
4. Bọc dynamic import Firebase trong try/catch, cập nhật trạng thái.
5. Thử: online 1 lần → DevTools Offline → reload; xoá "Clear site data" → offline → reload (kỳ vọng: không có SW nên không chạy được, đó là giới hạn trình duyệt — ghi vào docs).

## Success Criteria
- [x] `node --test "tests/*.test.mjs"` xanh (gồm `sw-assets`).
- [x] Smoke test bước 6 pass; biểu đồ và icon hiển thị khi offline.
- [x] Chặn domain `www.gstatic.com` trong DevTools → app vẫn dùng được local.

## Risk Assessment
- Cache response CDN sai version gây lỗi kéo dài → mọi URL đã pin version nên cache key đổi khi đổi version.
- Opaque response (no-cors) chiếm quota lớn → chỉ cache `type === 'cors'` và status 200.

## Kết quả (2026-11-14)
- agy: pin `lucide@1.72.0`, `chart.js@4.6.1` (+`crossorigin`), `CDN_CACHE` stale-while-revalidate cho allowlist host, fallback offline (`Response.error()`, navigate → `index.html`), trạng thái `offline` + badge, `tests/sw-assets.test.mjs`.
- Claude sửa thêm: precache dùng `cache: 'reload'` (tránh cache bản cũ do HTTP cache của GitHub Pages); `crossorigin` cho CSS Google Fonts để cache được.
- Đã kiểm: tắt server → reload → app, icon, biểu đồ, font đều chạy từ cache. CHƯA kiểm: chặn riêng `www.gstatic.com` (không giả lập được trong khung browser; nhánh catch đơn giản).
