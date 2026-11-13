---
phase: 9
title: "Đồng bộ tài liệu"
status: completed
priority: P3
effort: "0.5d"
dependencies: [8]
---

# Phase 09: Đồng bộ tài liệu

## Overview
Cập nhật tài liệu cho khớp hiện trạng sau refactor: Firebase là cloud duy nhất, không còn Google Sheets, không có IndexedDB riêng, có test.

## Requirements
- `README.md`: bỏ hướng dẫn Google Client ID/Sheets; thêm phần Firebase (đăng nhập Google/ẩn danh, project mặc định, cách tự dùng project riêng, deploy `firestore.rules`), lệnh test, giới hạn offline lần đầu.
- `docs/system-architecture.md`: sơ đồ mới (state → domain → firebase-sync → Firestore per-record), bỏ claim IndexedDB của app (chỉ Firestore SDK dùng IndexedDB làm cache), mô tả schema `users/{uid}/...` và migration.
- `docs/code-standards.md`: thêm quy ước `js/domain/` thuần + test, ngày lưu `YYYY-MM-DD` / hiển thị `DD/MM/YYYY`, ngoại lệ 200 dòng (nếu có ở phase 08), quy tắc cập nhật `ASSETS_TO_CACHE`.
- `docs/project-changelog.md`: mục mới 2026-11 (bỏ Sheets, schema mới + migration, sửa lỗi sync/sổ tiền, bảo mật, PWA); hướng dẫn reload mọi thiết bị.
- `docs/development-roadmap.md`: thêm giai đoạn refactor, bỏ claim IndexedDB.
- `CLAUDE.md`: mục Architecture (bỏ Google Sync, thêm Firebase + domain + tests).
- `manifest.json` description (nếu chưa làm ở phase 02).

## Related Code Files
- Modify: `README.md`, `CLAUDE.md`, `docs/system-architecture.md`, `docs/code-standards.md`, `docs/project-changelog.md`, `docs/development-roadmap.md`

## Implementation Steps
1. Đọc từng tài liệu, đối chiếu với code sau phase 08.
2. Sửa nhỏ nhất đủ đúng; link tới file code thay vì chép chi tiết.
3. Kiểm tra mọi link tương đối và lệnh trong docs chạy được.

## Success Criteria
- [x] `grep -rniE "google sheets|indexeddb|client id" README.md docs CLAUDE.md` chỉ còn các câu đúng (vd: Firestore cache dùng IndexedDB).
- [x] Lệnh trong README/CLAUDE.md chạy được.

## Risk Assessment
- Thấp. Signal: docs mô tả tính năng không có trong code → kiểm tra lại bằng grep trước khi viết.
