# Development Roadmap

## Lộ Trình Phát Triển Ứng Dụng Quản Lý Chi Tiêu

- **Trạng thái hiện tại**: Đã hoàn thành giai đoạn tái cấu trúc cốt lõi (v2.0) và đang chuẩn bị cho đợt nâng cấp giao diện & chia tách module
- **Kế hoạch ban đầu**: [plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md](../plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md)

---

### Giai Đoạn 1: Setup & Cơ Sở Hạ Tầng (Phases 01 - 02)
- [x] **Phase 01: Setup Cấu Trúc & Design System**
  - Cấu trúc HTML5 semantic, CSS Variables (Design Tokens, Dark/Light Mode)
  - Layout responsive cho Desktop (Sidebar) và Mobile (Bottom Navigation Bar)
  - Router chuyển đổi tab và theme switcher trong `js/app.js`
- [x] **Phase 02: State Management & Local Storage Engine**
  - Quản lý trạng thái tập trung (Reactive Store / Pub-Sub trong `js/state.js`)
  - Tầng lưu trữ `localStorage` an toàn qua `js/services/storage.js` với các khóa tiền tố `qlct_*`
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
  - Quản lý sổ nợ (Cho vay / Đi vay) và tiến độ trả nợ

---

### Giai Đoạn 3: Nâng Cao & Phân Tích (Phases 05 - 06)
- [x] **Phase 05: Biểu Đồ & Báo Cáo Phân Tích (Chart.js)**
  - Biểu đồ Doughnut cơ cấu chi tiêu theo danh mục
  - Biểu đồ cột/đường xu hướng thu nhập vs chi tiêu 6 tháng
- [x] **Phase 06: Quản Trị & Sao Lưu Dữ Liệu**
  - Xuất / Nhập dữ liệu dự phòng file JSON & CSV
  - Quản lý cấu hình ứng dụng và thiết lập đồng bộ

---

### Giai Đoạn 4: Hoàn Thiện & Đóng Gói PWA (Phase 07)
- [x] **Phase 07: Kiểm Thử, Tối Ưu Hóa & Đóng Gói Triển Khai GitHub Pages**
  - Toast notifications, xác nhận thao tác an toàn
  - Web App Manifest (PWA) cài đặt lên màn hình chính điện thoại
  - Precache tài nguyên ngoại tuyến qua Service Worker

---

### Giai Đoạn 5: Refactor & Bảo Trì (2026-11)
- [x] **Gỡ bỏ Google Sheets sync & Google OAuth Client ID**:
  - Loại bỏ hoàn toàn mã nguồn cũ và các khóa token không còn sử dụng.
- [x] **Chuyển đổi toàn diện sang Firebase Firestore**:
  - Cấu trúc per-record document (`users/{uid}/{collection}/{id}`) và đánh dấu schema version 2 tại `users/{uid}/meta/schema`.
  - Hỗ trợ đăng nhập Google popup và đăng nhập Ẩn danh (Guest).
- [x] **Tách tầng Pure Domain Modules (`js/domain/`)**:
  - Xây dựng các module nghiệp vụ thuần túy không phụ thuộc bên ngoài: `ledger.js`, `debt-rules.js`, `sync-diff.js`, `legacy-migration.js`, `account-switch.js`, `settings-migration.js`.
  - Thiết lập bộ kiểm thử unit test tự động với `node --test "tests/*.test.mjs"`.
- [x] **Đồng bộ hóa 3-way Merge & Quản lý phiên Cloud an toàn**:
  - Phát hiện và tự động nâng cấp dữ liệu cấu trúc cũ (Legacy Migration) kèm bản sao lưu an toàn.
  - Xử lý chuyển đổi tài khoản (Account Switch) ngăn chặn trộn lẫn dữ liệu.
  - Quản lý baseline hash từng bản ghi, hoãn đẩy dữ liệu cho đến khi nhận đủ initial snapshot.
- [x] **Kiểm thử tự động hóa tài nguyên PWA**:
  - Bổ sung `tests/sw-assets.test.mjs` bảo đảm đồng bộ 100% giữa file tĩnh trên đĩa và `ASSETS_TO_CACHE` trong `sw.js`.

---

### Giai Đoạn 6: Làm Lại Giao Diện (Bố Cục + UX) & Tách Module
- [ ] **Tái thiết kế giao diện (UI redesign & UX refinement)**:
  - Tối ưu hóa bố cục trực quan, cải thiện tương tác người dùng trên mobile và desktop.
- [ ] **Tách nhỏ module (Modularization)**:
  - Chia nhỏ các component hiện đang có kích thước lớn (>200 dòng) thành các sub-component và helper module chuyên biệt theo quy chuẩn code standards.
- [ ] **Nâng cao khả năng truy cập (Accessibility & Keyboard Navigation)**:
  - Hoàn thiện a11y cho toàn bộ modals và các luồng phím tắt.
