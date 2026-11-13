---
phase: 1
title: "Design system + khối UI dùng chung"
status: completed
dependencies: []
---

# Phase 01: Design system + khối UI dùng chung

## Overview
Bộ token mới (sáng/tối, mặc định theo hệ thống) và các khối UI dùng chung mà các phase sau lắp vào. Chưa đổi màn hình nào.

## Design spec
- Font Inter; số tiền dùng `font-variant-numeric: tabular-nums`.
- Màu (sáng / tối):
  - Nền app `#f5f6fa` / `#0b0f17`; surface `#ffffff` / `#131a24`; surface nổi `#ffffff` / `#1b2430`; viền `#e6e8ef` / `#243041`.
  - Chữ chính `#0f172a` / `#e8edf5`; phụ `#5b6475` / `#a3adbd`; mờ `#8a93a5` / `#6b7587`.
  - Primary `#4f46e5` / `#818cf8`; Thu `#059669` / `#34d399`; Chi `#e11d48` / `#fb7185`; Chuyển `#7c3aed` / `#a78bfa`; Cảnh báo `#d97706` / `#fbbf24`. Mỗi màu có biến `-bg` nhạt (light: tint 10%, dark: alpha 16%).
- Bo góc: thẻ 16px, sheet 24px (2 góc trên), nút 12px, chip full.
- Bóng nhẹ ở light; dark dùng viền thay bóng.
- Theme: thuộc tính `data-theme` trên `<html>` = `light` | `dark`; lựa chọn người dùng lưu `localStorage['theme']` = `light|dark|system` (mặc định `system`, theo `prefers-color-scheme`, nghe `change`).

## Requirements
- `css/variables.css` viết lại theo spec (giữ tên biến cũ đang được dùng hoặc thêm alias để màn hình cũ không vỡ cho tới khi được thay).
- Khối dùng chung (mỗi file < 200 dòng, ES module, không global):
  - `js/ui/theme.js`: `getThemePreference()`, `setThemePreference(pref)`, `applyTheme()`; thay `window.setAppTheme/getAppTheme`.
  - `js/ui/bottom-sheet.js`: mở/đóng sheet từ dưới (desktop: dialog giữa màn hình), backdrop, Escape, trap focus (gộp `js/utils/modal-a11y.js`), trả promise khi đóng.
  - `js/ui/currency-input.js`: định dạng `###.###.###` khi gõ, trả số nguyên; thay 5 chỗ trùng ở bước sau.
  - `js/ui/category-grid.js`: lưới icon hạng mục (lọc theo loại), trả id; dùng `safeColor`/`safeIconName`/`escapeHtml`.
  - `js/ui/wallet-picker.js`: chọn ví dạng chip/hàng ngang, hiện số dư (tôn trọng che số).
  - `css/ui.css` (hoặc `css/components/*.css`) cho các khối trên.
- `sw.js`: thêm file mới, bump `CACHE_NAME`.

## Files
- Create: `js/ui/theme.js`, `js/ui/bottom-sheet.js`, `js/ui/currency-input.js`, `js/ui/category-grid.js`, `js/ui/wallet-picker.js`, `css/ui.css`, tests thuần nếu có logic tách được (vd `formatCurrencyInput` → `js/domain/` hoặc `js/utils/formatters.js` + test).
- Modify: `css/variables.css`, `index.html` (link css), `sw.js`.

## Success Criteria
- [ ] Test xanh; trang demo tạm thời không cần — kiểm bằng phase 02-03.
- [ ] Đổi hệ điều hành sáng/tối → app đổi theo khi chọn `system`.
