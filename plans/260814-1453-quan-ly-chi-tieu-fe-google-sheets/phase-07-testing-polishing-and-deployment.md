# Phase 07: Kiểm Thử, Tối Ưu Hóa & Đóng Gói Triển Khai GitHub Pages

## Context Links
- Plan: [plan.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md)
- Phase 06: [phase-06-google-sheets-sync-and-export-import.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/phase-06-google-sheets-sync-and-export-import.md)

## Overview
- **Priority**: High (P0)
- **Current status**: Complete
- **Brief description**: Kiểm thử toàn diện các luồng nghiệp vụ (Thu/Chi, Ví, Ngân sách, Biểu đồ, Sync Google Sheets), tối ưu hóa trải nghiệm mượt mà, cấu hình PWA (Web App Manifest + Service Worker) để có thể "Cài đặt ứng dụng" trên điện thoại iOS/Android, và viết tài liệu hướng dẫn deploy GitHub Pages.

## Key Insights
- Khi thêm `manifest.json` và Service Worker cơ bản, người dùng có thể bấm "Add to Home Screen" trên iPhone (Safari) hoặc Android (Chrome) để sử dụng như một App di động thực thụ, mở lên không có thanh URL của trình duyệt.
- Cần có tài liệu `README.md` rõ ràng, hướng dẫn:
  1. Cách mở chạy trực tiếp trên máy tính (Live Server / Mở file HTML).
  2. Cách tạo Google Cloud OAuth Client ID (kèm ảnh/bước rõ ràng).
  3. Cách bật GitHub Pages từ repo GitHub trong 3 click chuột.

## Requirements
- **Functional Requirements**:
  - Web App Manifest (`manifest.json`) hỗ trợ PWA (tên ứng dụng, icon, màu theme, display: standalone).
  - Toast thông báo cho mọi hành động (Thêm thành công, Xóa thành công, Đã đồng bộ...).
  - Xử lý xác nhận an toàn (Confirm modal) trước khi Xóa giao dịch / Reset dữ liệu.
  - File `README.md` hướng dẫn chi tiết toàn bộ tính năng và cách deploy.
- **Non-functional Requirements**:
  - Không có lỗi JavaScript runtime console.
  - Tương thích tốt trên màn hình nhỏ từ 360px (mobile) đến 2560px (desktop 2K/4K).

## Architecture
- `manifest.json`: Web App Manifest cho PWA.
- `README.md`: Tài liệu hướng dẫn sử dụng, cấu hình Google API và deploy GitHub Pages.
- `js/components/toast.js`: Hệ thống thông báo nổi mượt mà.

## Related Code Files
- **Create**:
  - `manifest.json`
  - `README.md`
  - `js/components/toast.js`
- **Modify**:
  - `index.html`
  - `css/components.css`
  - `js/app.js`

## Implementation Steps
1. Xây dựng component `toast.js` hiển thị thông báo popup (Success, Error, Info) tự biến mất sau 3 giây.
2. Tạo file `manifest.json` cấu hình PWA và liên kết vào thẻ `<head>` của `index.html`.
3. Kiểm thử luồng sử dụng hoàn chỉnh: Khởi tạo -> Thêm thu/chi -> Chuyển tiền ví -> Đặt ngân sách -> Xem biểu đồ -> Kết nối Google Sheets -> Xuất/Nhập JSON.
4. Kiểm thử giao diện trên Chrome DevTools giả lập iPhone 14, Pixel 7, iPad và Desktop.
5. Viết tài liệu `README.md` với đầy đủ hướng dẫn thiết lập Google OAuth và Deploy lên GitHub Pages.

## Todo List
- [x] Xây dựng hệ thống Toast notifications (`toast.js`)
- [x] Tạo file `manifest.json` chuẩn PWA
- [x] Kiểm thử toàn diện các tính năng trên Mobile & Desktop
- [x] Viết tài liệu `README.md` hướng dẫn sử dụng và triển khai GitHub Pages
- [x] Đánh giá tổng thể hiệu năng và chuẩn bị sẵn sàng bàn giao

## Success Criteria
- Ứng dụng hoạt động trơn tru 100%, không phát sinh lỗi console.
- Ứng dụng có thể cài đặt về màn hình chính trên điện thoại (PWA).
- Triển khai thành công trên GitHub Pages chỉ trong 1 thao tác push code.

## Risk Assessment & Mitigation
- **Rủi ro**: Đường dẫn icon hoặc asset bị sai khi deploy lên GitHub Pages dạng `https://username.github.io/repo-name/`.
- **Giải pháp**: Sử dụng đường dẫn tương đối (`./assets/...`, `./css/...`) trong toàn bộ code.

## Security Considerations
- Đảm bảo an toàn không để lộ thông tin nhạy cảm trong mã nguồn công khai.

## Next Steps
- Hoàn thành toàn bộ kế hoạch triển khai và chuyển sang giai đoạn thực thi theo từng Phase.
