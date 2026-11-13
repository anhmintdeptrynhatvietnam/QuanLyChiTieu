---
phase: 9
title: "Kiểm thử toàn bộ + release"
status: completed
dependencies: [1, 2, 3, 4, 5, 6, 7, 8]
---

# Phase 09: Kiểm thử toàn bộ + release

## Steps
1. `node --test "tests/*.test.mjs"`; `node --check` mọi file JS.
2. Smoke test trên browser ở 375px và 1280px, theme sáng + tối: mọi luồng trong acceptance của plan; console không lỗi, không vi phạm CSP.
3. Offline: tải 1 lần → tắt server → reload.
4. Đăng nhập Google + sync 2 tab.
5. Cập nhật docs (`docs/system-architecture.md` cấu trúc `js/ui`, `js/views`; changelog 2.1.0; README ảnh/mô tả nếu cần).
6. Bump `CACHE_NAME`, commit, merge `feat/ui-redesign` → `main` (fast-forward hoặc merge commit), push; kiểm tra bản live.

## Rollback
`git revert` merge trên `main` + push; bump `CACHE_NAME` để thiết bị nhận lại bản cũ.
