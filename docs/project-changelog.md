# Project Changelog

Tất cả các thay đổi quan trọng của dự án Ứng Dụng Quản Lý Chi Tiêu sẽ được ghi nhận tại đây.

---

## [2.0.0] - 2026-11-14

### Đã gỡ bỏ (Removed)
- Loại bỏ hoàn toàn cơ chế đồng bộ qua Google Sheets API v4 (`js/services/google-sheets.js`, `js/services/google-auth.js`) và cấu hình Google OAuth Client ID.
- Xóa bỏ các khóa lưu trữ token Google cũ trong `localStorage` (`quanlythuchi_google_access_token`, `quanlythuchi_google_token_expires_at`).

### Thay đổi (Changed)
- **Firebase Firestore là dịch vụ đám mây duy nhất**: Thay thế toàn diện giải pháp đồng bộ đám mây bằng Firebase Firestore với độ trễ thấp (<100ms) và nạp thư viện động theo nhu cầu ([js/services/firebase-sdk.js](../js/services/firebase-sdk.js)).
- **Cấu trúc Firestore Per-Record**: Chuyển đổi từ định dạng lưu mảng nguyên khối `users/{uid}/data/{table}` sang lưu từng bản ghi riêng biệt:
  - `users/{uid}/{transactions|wallets|categories|budgets|debts}/{id}`
  - `users/{uid}/settings/main`
  - Đánh dấu phiên bản schema version 2 tại `users/{uid}/meta/schema`.
- **Tự động nâng cấp dữ liệu cũ (Legacy Migration)**: Tự động phát hiện dữ liệu theo cấu trúc cũ trên Cloud, hiển thị hộp thoại xác nhận, tự động tải file sao lưu JSON về máy trước khi nâng cấp và bảo lưu toàn bộ tài liệu cũ trên Cloud ([js/services/firebase-migration.js](../js/services/firebase-migration.js), [js/services/cloud-session.js](../js/services/cloud-session.js)).
- **Xử lý chuyển đổi tài khoản (Account-switch)**: Khi phát hiện đăng nhập bằng tài khoản khác tài khoản trước đó, ứng dụng làm mới dữ liệu trên máy để tránh trộn lẫn dữ liệu giữa các tài khoản ([js/domain/account-switch.js](../js/domain/account-switch.js)).
- **Tách tầng Pure Domain Modules**: Tách toàn bộ logic nghiệp vụ cốt lõi vào thư mục [js/domain/](../js/domain/) gồm các hàm thuần túy, zero external imports, độc lập với DOM và Storage: `ledger.js`, `debt-rules.js`, `sync-diff.js`, `legacy-migration.js`, `account-switch.js`, `settings-migration.js`.

### Sửa lỗi (Fixed)
- **Khắc phục lỗi mất dữ liệu và ghi đè khi đồng bộ**: Triển khai thuật toán 3-way merge và quản lý baseline hash từng bản ghi qua khóa `qlct_sync_baseline_{uid}` ([js/domain/sync-diff.js](../js/domain/sync-diff.js)).
- **Chặn ghi đè dữ liệu Cloud khi vừa khởi động**: Tạm dừng đẩy dữ liệu lên Cloud cho đến khi nhận đủ initial snapshot từ toàn bộ collections, tránh việc dữ liệu rỗng/mặc định local đè lên dữ liệu đã có trên Cloud.
- **Tính toàn vẹn sổ cái (Ledger Integrity)**: Số dư các ví luôn được tính toán chính xác bằng cách replay toàn bộ giao dịch, các khoản vay/trả nợ, chỉnh sửa giao dịch và cập nhật ngân sách ([js/domain/ledger.js](../js/domain/ledger.js)).
- **Bảo toàn thứ tự danh mục và ví**: Khắc phục lỗi xáo trộn thứ tự sau khi tải dữ liệu từ Cloud (Firestore tự động sắp xếp document theo ID).
- **Tuân thủ giới hạn Firestore**: Khống chế số lượng thao tác trong mỗi đợt ghi theo lô (batch writes) ≤ 450 operations/lần.

### Bảo mật (Security)
- Triển khai quy tắc bảo mật [firestore.rules](../firestore.rules), mỗi người dùng chỉ đọc/ghi được `users/{uid}/**` của chính mình.
- Phòng chống XSS: dữ liệu hiển thị động đi qua `escapeHtml()` hoặc `textContent` ([js/utils/helpers.js](../js/utils/helpers.js)); màu/icon hạng mục được kiểm tra bằng `safeColor`/`safeIconName`.
- Content-Security-Policy (thẻ meta trong `index.html`) và Subresource Integrity cho script CDN Lucide/Chart.js.
- File sao lưu JSON không còn chứa thông tin tài khoản (`firebaseUser`); file CSV chống formula injection ([js/domain/export-sanitize.js](../js/domain/export-sanitize.js)).

### PWA & Ngoại Tuyến (Offline)
- Bổ sung kiểm thử tự động [tests/sw-assets.test.mjs](../tests/sw-assets.test.mjs) bảo đảm mọi file tĩnh thực tế trên đĩa đều nằm trong danh sách `ASSETS_TO_CACHE` của [sw.js](../sw.js).
- Ghim cứng phiên bản các thư viện CDN (Lucide 1.72.0, Chart.js 4.6.1) và lưu cache runtime trong `qlct-cdn-v1`.

### Hướng dẫn nâng cấp (Upgrade Guide)
- **Tải lại trang trên mọi thiết bị**: Sau khi phát hành bản cập nhật 2.0.0, người dùng cần reload ứng dụng trên tất cả các thiết bị đang mở. Nếu thiết bị vẫn chạy phiên bản cũ trong bộ nhớ đệm, nó sẽ tiếp tục đọc/ghi vào cấu trúc Cloud cũ.
- **Hộp thoại nâng cấp**: Hộp thoại "Nâng cấp dữ liệu Cloud" sẽ xuất hiện một lần duy nhất cho mỗi tài khoản khi đăng nhập nếu tài khoản đó vẫn còn dữ liệu ở định dạng cũ. Hệ thống sẽ tự động sao lưu dữ liệu local ra file `.json` trước khi tiến hành chuyển đổi.

---

## [1.0.0] - 2026-08-14

### Đã hoàn thành (Added)
- **Phase 07: Kiểm Thử, Tối Ưu & Deployment**:
  - Tích hợp Toast Notifications (`js/components/toast.js`).
  - Hỗ trợ PWA Web App Manifest (`manifest.json`) cho phép cài đặt lên màn hình chính điện thoại iOS/Android.
  - Tài liệu hướng dẫn sử dụng và triển khai GitHub Pages chi tiết (`README.md`).
- **Phase 06: Dịch Vụ Đồng Bộ Dữ Liệu Ban Đầu & Data Management**:
  - Tích hợp cơ chế đồng bộ đám mây và quản lý phiên bản dữ liệu.
  - Xuất file `.JSON`, `.CSV` và khôi phục dữ liệu (`js/services/export-import.js`).
  - Màn hình Cài đặt & cấu hình đồng bộ (`js/components/settings.js`).
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
  - Khởi tạo bộ khung HTML5 semantic (`index.html`) tích hợp CDN Google Fonts, Lucide Icons, Chart.js.
  - Xây dựng Design Tokens, Dark/Light mode (`css/variables.css`), CSS Base (`css/base.css`), Components (`css/components.css`), Layouts responsive (`css/layouts.css`).
- **Brainstorming & Architecture Design**:
  - Báo cáo phân tích giải pháp kỹ thuật ban đầu [brainstorm-report.md](../plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/reports/brainstorm-report.md).
  - Lập kế hoạch triển khai ban đầu [plan.md](../plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md).
  - Khởi tạo tài liệu kiến trúc hệ thống, roadmap và tiêu chuẩn code trong `./docs/`.
