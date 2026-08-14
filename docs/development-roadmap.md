# Development Roadmap

## Lộ Trình Phát Triển Ứng Dụng Quản Lý Chi Tiêu

- **Trạng thái tổng thể**: 100% hoàn thành (Dự án đã sẵn sàng chạy và deploy)
- **Kế hoạch chi tiết**: [plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md)

---

### Giai Đoạn 1: Setup & Cơ Sở Hạ Tầng (Phases 01 - 02)
- [x] **Phase 01: Setup Cấu Trúc & Design System**
  - Cấu trúc HTML5 semantic, CSS Variables (Design Tokens, Dark/Light Mode)
  - Layout responsive cho Desktop (Sidebar) và Mobile (Bottom Navigation Bar)
  - Router chuyển đổi tab và theme switcher trong `js/app.js`
- [x] **Phase 02: State Management & Local Storage Engine**
  - Quản lý trạng thái tập trung (Reactive Store / Pub-Sub)
  - Tầng lưu trữ LocalStorage / IndexedDB an toàn
  - Danh mục chi tiêu và ví tài chính mặc định

---

### Giai Đoạn 2: Tính Năng Cốt Lõi (Phases 03 - 04)
- [x] **Phase 03: Giao Dịch Thu Chi & Dashboard Tổng Quan**
  - Modal tạo/sửa giao dịch Thu, Chi, Chuyển khoản ví
  - Danh sách giao dịch gom nhóm theo ngày kèm bộ lọc & tìm kiếm
  - Thẻ thống kê tổng quan (Số dư, Tổng thu, Tổng chi, Tiết kiệm)
- [x] **Phase 04: Quản Lý Ví & Ngân Sách Hạn Mức**
  - Module quản lý đa ví (Tiền mặt, Ngân hàng, Thẻ tín dụng, Tiết kiệm)
  - Module ngân sách hạn mức theo danh mục với thanh tiến độ cảnh báo

---

### Giai Đoạn 3: Nâng Cao & Đồng Bộ Đám Mây (Phases 05 - 06)
- [x] **Phase 05: Biểu Đồ & Báo Cáo Phân Tích (Chart.js)**
  - Biểu đồ Doughnut cơ cấu chi tiêu theo danh mục
  - Biểu đồ cột/đường xu hướng thu nhập vs chi tiêu 6 tháng
- [x] **Phase 06: Đồng Bộ Google Sheets API & Quản Trị Dữ Liệu**
  - Đăng nhập Google một chạm qua Google Identity Services (GIS)
  - Tự động tạo bảng tính `QuanLyChiTieu_DB` và đồng bộ 2 chiều
  - Xuất / Nhập dữ liệu dự phòng file JSON & CSV

---

### Giai Đoạn 4: Hoàn Thiện & Triển Khai (Phase 07)
- [x] **Phase 07: Kiểm Thử, Tối Ưu Hóa & Đóng Gói Triển Khai GitHub Pages**
  - Toast notifications, xác nhận thao tác an toàn
  - Web App Manifest (PWA) cài đặt lên màn hình chính điện thoại
  - Tài liệu README.md hướng dẫn sử dụng và deploy GitHub Pages
