# Development Roadmap

## Lộ Trình Phát Triển Ứng Dụng Quản Lý Chi Tiêu

- **Trạng thái hiện tại**: Đã hoàn thành Giai đoạn 6 (Làm lại giao diện, bố cục, UX và tách module hóa)
- **Kế hoạch thực hiện**: [plans/261114-0031-ui-redesign-and-modularization/plan.md](../plans/261114-0031-ui-redesign-and-modularization/plan.md)

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
- [x] **Tái thiết kế giao diện (UI redesign & UX refinement)**:
  - Khung giao diện responsive: Desktop Sidebar (≥1024px) và Mobile Bottom Navigation Bar 5 mục (Tổng quan · Giao dịch · [+] · Báo cáo · Thêm) với nút nổi FAB `+` chính giữa.
  - Quick-add bottom sheet ghi chép giao dịch nhanh trong ~3 chạm (nhập số tiền lớn → chọn hạng mục trên lưới icon → lưu; tự động ghi nhớ loại và ví lựa chọn gần nhất).
  - Tìm kiếm giao dịch không phân biệt dấu tiếng Việt (`normalizeVietnamese`), gom nhóm danh sách theo từng ngày kèm tổng tiền ngày và bộ lọc filter sheet chuyên sâu.
  - Hỗ trợ 3 chế độ Theme: Sáng (Light), Tối (Dark) và Theo hệ thống (System) với chuyển đổi mượt mà.
- [x] **Tách nhỏ module (Modularization)**:
  - Đưa 100% file JavaScript trong toàn bộ dự án về dưới ngưỡng 200 dòng code.
  - Xóa bỏ hoàn toàn biến toàn cục gắn trên `window.*` (`window.appInstance`, `window.transactionModal`, `window.setAppTheme`, `window.showToast`).
  - Tách `js/state.js` thành Thin Store kết hợp với các action modules trong `js/state/*` (`transaction-actions`, `wallet-actions`, `debt-actions`, `category-budget-actions`, `cloud-session-actions`, `persistence`).
  - Tách `js/services/firebase-sync.js` thành orchestrator kết hợp `firebase-sync-listeners.js`, `firebase-sync-ops.js`, `firebase-sync-pull.js`.
  - Tách `js/domain/sync-diff.js` thành re-export từ `record-hash.js`, `push-diff.js`, `remote-merge.js`.
  - Bổ sung các module pure domain độc lập (`transaction-entry.js`, `period-summary.js`, `transaction-query.js`, `budget-progress.js`, `analytics-series.js`) kèm bộ unit test toàn diện trong `tests/`.
  - Phân tách cấu trúc CSS rõ ràng: `css/variables.css`, `css/ui.css`, `css/sheets.css`, `css/views/*.css`, `css/layouts.css`.
- [x] **Nâng cao khả năng truy cập (Accessibility & Keyboard Navigation)**:
  - Hoàn thiện a11y, quản lý focus trap, phím Escape và hỗ trợ phím tắt số tiền cho toàn bộ bottom sheets và confirm dialogs.
