# Phase 01: Setup Cấu Trúc & Design System

## Context Links
- Plan: [plan.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md)
- Báo cáo Brainstorming: [brainstorm-report.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/reports/brainstorm-report.md)

## Overview
- **Priority**: High (P0)
- **Current status**: Complete
- **Brief description**: Thiết lập bộ khung dự án Single Page Application thuần HTML5 + Vanilla CSS + Vanilla JS ES Modules, xây dựng hệ thống Design Tokens (màu sắc, typography, dark/light mode), và layout responsive (Sidebar cho Desktop, Bottom Navigation cho Mobile).

## Key Insights
- Tránh dùng framework cồng kềnh, ưu tiên CSS Variables để hỗ trợ chuyển đổi Dark / Light mode tức thì không bị giật trang.
- Sử dụng Lucide Icons và Google Fonts (Inter / Plus Jakarta Sans) thông qua CDN để giao diện mang chuẩn thiết kế hiện đại, cao cấp.
- Layout responsive cần có vùng hiển thị nội dung chính linh hoạt, nút nổi FAB `+` cố định trên mobile.

## Requirements
- **Functional Requirements**:
  - Giao diện chuyển đổi tab mượt mà: Dashboard, Giao dịch (Transactions), Ví (Wallets), Ngân sách (Budgets), Cài đặt (Settings).
  - Tự động nhận diện theme hệ thống (Dark/Light) và cho phép người dùng chuyển đổi thủ công.
- **Non-functional Requirements**:
  - Thời gian tải trang ban đầu < 1 giây.
  - Tương thích tốt trên Chrome, Safari, Edge, Firefox trên cả điện thoại và máy tính.

## Architecture
- `index.html`: Khung sườn semantic HTML5, nạp các CDN cần thiết (Google Fonts, Lucide Icons, Chart.js, GIS SDK).
- `css/variables.css`: Chứa CSS Custom Properties (`--bg-primary`, `--text-primary`, `--primary-color`, `--card-bg`, v.v.).
- `css/base.css`: Reset CSS, typography, utility classes.
- `css/components.css`: Button, Card, Badge, Modal, Input controls, Floating Action Button.
- `css/layouts.css`: Desktop Sidebar + Header layout và Mobile Bottom Bar layout.

## Related Code Files
- **Create**:
  - `index.html`
  - `css/variables.css`
  - `css/base.css`
  - `css/components.css`
  - `css/layouts.css`
  - `js/app.js`

## Implementation Steps
1. Tạo file `index.html` với cấu trúc chuẩn HTML5, liên kết Google Fonts (Inter), Lucide CDN, Google GIS.
2. Xây dựng `css/variables.css` định nghĩa toàn bộ biến màu sắc cho cả 2 theme Light và Dark.
3. Viết `css/base.css` và `css/components.css` định nghĩa các thành phần UI dùng chung (Cards, Buttons, Inputs, Dialogs/Modals, Pills).
4. Viết `css/layouts.css` xử lý Responsive: Desktop (Sidebar cố định bên trái) và Mobile (Bottom Navigation Bar và Header tối giản).
5. Kiểm tra hiển thị responsive và switch theme Light/Dark.

## Todo List
- [x] Khởi tạo `index.html` đầy đủ thẻ meta, favicon và CDN links
- [x] Xây dựng bảng biến `css/variables.css` (Dark/Light tokens)
- [x] Xây dựng `css/base.css` và `css/components.css`
- [x] Xây dựng `css/layouts.css` (Desktop Sidebar + Mobile Bottom Bar)
- [x] Xây dựng `js/app.js` xử lý chuyển tab và dark/light theme
- [x] Kiểm thử responsive trên các kích thước màn hình (Mobile 375px -> Desktop 1920px)

## Success Criteria
- Giao diện hiển thị đúng chuẩn thẩm mỹ, sạch sẽ, chuyển đổi Dark/Light mode mượt mà.
- Không có lỗi CSS hoặc font chữ bị vỡ trên cả Desktop và Mobile.

## Risk Assessment & Mitigation
- **Rủi ro**: Xung đột responsive giữa thanh Bottom Bar trên mobile và Sidebar desktop.
- **Giải pháp**: Dùng CSS Media Query chuẩn (`@media (min-width: 768px)` và `@media (max-width: 767px)`) để ẩn/hiện thành phần tương ứng một cách triệt để.

## Security Considerations
- Sử dụng Content-Security-Policy (CSP) an toàn và chuẩn HTTPS khi deploy.

## Next Steps
- Chuyển sang Phase 02: Xây dựng State Manager và Storage Engine.
