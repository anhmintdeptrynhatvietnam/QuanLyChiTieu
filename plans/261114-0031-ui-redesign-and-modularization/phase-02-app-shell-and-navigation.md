---
phase: 2
title: "Khung app + điều hướng mới"
status: pending
dependencies: [1]
---

# Phase 02: Khung app + điều hướng mới

## Requirements
- Mobile (< 768px): thanh dưới 5 mục: Tổng quan · Giao dịch · [+] (nút tròn nổi giữa thanh, mở sheet ghi giao dịch) · Báo cáo · Thêm. Bỏ FAB cũ. Tôn trọng `env(safe-area-inset-bottom)`.
- "Thêm" là màn hình danh sách: Ví, Vay/Nợ, Ngân sách, Cài đặt (+ trạng thái Cloud). Mở màn con có nút quay lại.
- Desktop (≥ 1024px): sidebar trái đủ mục; nội dung max-width ~1100px; nút "Ghi giao dịch" trên header.
- Header gọn: tiêu đề màn hình, badge Cloud (giữ logic hiện tại), nút che số.
- Router nhỏ `js/ui/router.js`: `navigate(viewId)`, lịch sử bằng `location.hash` (nút back Android quay lại màn trước), active state đồng bộ sidebar + thanh dưới.
- `js/app.js` < 200 dòng: chỉ bootstrap; badge Cloud tách `js/ui/sync-badge.js`.

## Giữ nguyên hành vi
- Mọi view id hiện có vẫn truy cập được; badge Cloud mở Cài đặt; đăng ký SW; `stateStore.setCloudSessionUi`.

## Files
- Modify: `index.html`, `css/layouts.css`, `js/app.js`, `sw.js`. Create: `js/ui/router.js`, `js/ui/sync-badge.js`, view "Thêm" (`js/views/more/more-view.js`).

## Success Criteria
- [ ] 375px: 5 mục, nút + giữa, không có phần tử che nội dung; back Android/trình duyệt quay đúng màn.
- [ ] 1280px: sidebar, không có thanh dưới.
