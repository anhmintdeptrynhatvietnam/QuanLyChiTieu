# Project Changelog

Tất cả các thay đổi quan trọng của dự án Ứng Dụng Quản Lý Chi Tiêu sẽ được ghi nhận tại đây.

---

## [Unreleased] - 2026-08-14

### Đã hoàn thành (Added)
- **Phase 07: Kiểm Thử, Tối Ưu & Deployment**:
  - Tích hợp Toast Notifications (`js/components/toast.js`).
  - Hỗ trợ PWA Web App Manifest (`manifest.json`) cho phép cài đặt lên màn hình chính điện thoại iOS/Android.
  - Tài liệu hướng dẫn sử dụng và triển khai GitHub Pages chi tiết (`README.md`).
- **Phase 06: Google Sheets API Sync & Data Management**:
  - Tích hợp Google Identity Services (GIS) OAuth 2.0 Client-side (`js/services/google-auth.js`).
  - Tự động tạo bảng tính `QuanLyChiTieu_DB` và đồng bộ dữ liệu 2 chiều (`js/services/google-sheets.js`).
  - Xuất file `.JSON`, `.CSV` và khôi phục dữ liệu (`js/services/export-import.js`).
  - Màn hình Cài đặt & Hướng dẫn lấy Google Client ID (`js/components/settings.js`).
- **Phase 05: Analytics & Charts (Chart.js)**:
  - Biểu đồ Doughnut phân bổ chi tiêu theo danh mục.
  - Biểu đồ Bar so sánh xu hướng Thu nhập vs Chi tiêu 6 tháng gần nhất (`js/components/analytics.js`).
  - Bảng tổng hợp chi tiết từng danh mục chi.
- **Phase 04: Wallets & Budgets**:
  - Quản lý đa ví & tài khoản tài chính, tính toán số dư tự động (`js/components/wallets.js`).
  - Thiết lập ngân sách hạn mức theo tháng kèm thanh tiến độ cảnh báo 3 mức màu (`js/components/budgets.js`).
- **Phase 03: Core UI Components & Transactions**:
  - Modal nhập liệu Thu / Chi / Chuyển khoản với gợi ý phím tắt nhanh (`js/components/transaction-modal.js`).
  - Danh sách giao dịch gom nhóm theo ngày kèm bộ lọc đa năng (`js/components/transaction-list.js`).
  - Thẻ thống kê tài chính và giao dịch gần đây trên Dashboard (`js/components/dashboard.js`).
- **Phase 02: State Management & Local Storage**:
  - Reactive State Manager với cơ chế Pub/Sub (`js/state.js`).
  - Storage Service an toàn (`js/services/storage.js`), Formatters tiền tệ & ngày tháng (`js/utils/formatters.js`), Helpers (`js/utils/helpers.js`).
- **Phase 01: Setup Cấu Trúc & Design System**:
  - Khởi tạo bộ khung HTML5 semantic (`index.html`) tích hợp CDN Google Fonts, Lucide Icons, Chart.js, GIS SDK.
  - Xây dựng Design Tokens, Dark/Light mode (`css/variables.css`), CSS Base (`css/base.css`), Components (`css/components.css`), Layouts responsive (`css/layouts.css`).
- **Brainstorming & Architecture Design**:
  - Báo cáo phân tích giải pháp kỹ thuật [brainstorm-report.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/reports/brainstorm-report.md).
  - Lập kế hoạch triển khai chi tiết gồm 7 giai đoạn [plan.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md).
  - Khởi tạo tài liệu kiến trúc hệ thống, roadmap và tiêu chuẩn code trong `./docs/`.
