# Project Changelog

Tất cả các thay đổi quan trọng của dự án Ứng Dụng Quản Lý Chi Tiêu sẽ được ghi nhận tại đây.

---

## [2.1.7] - 2026-11-14

### Thay đổi (Changed)
- **Form ghi giao dịch gọn hơn**: chọn ví/nguồn tiền nằm ngay dưới số tiền; lưới hạng mục thu nhỏ (5 cột, tên 1 dòng), chỉ hiện 2 hàng với các hạng mục dùng nhiều nhất trong 90 ngày ([js/domain/category-usage.js](../js/domain/category-usage.js)) và ô "Xem tất cả" để mở hết; hạng mục đang chọn luôn hiện.

## [2.1.6] - 2026-11-14

### Sửa lỗi (Fixed)
- **Form ghi giao dịch trên điện thoại bị xô lệch**: form chỉ còn cuộn dọc (khoá trượt ngang, lưới hạng mục không còn tràn khi tên hạng mục dài), trang phía sau không còn cuộn/nảy theo trên iPhone, và nút Lưu che kín phần đáy nên nội dung không lộ ra bên dưới nút.

## [2.1.5] - 2026-11-14

### Sửa lỗi (Fixed)
- **Chờ dữ liệu máy chủ khi mở app**: Firestore trả trước bản lưu tạm trên thiết bị (có thể cũ nhiều ngày); trước đây app coi đó là dữ liệu ban đầu, bắt đầu gộp/đẩy ngay, nên một thiết bị có bản lưu tạm cũ có thể đè bản mới hơn của thiết bị khác. Nay lần gộp đầu chỉ dùng snapshot đã được máy chủ xác nhận, gộp trên toàn bộ tài liệu ([js/domain/snapshot-changes.js](../js/domain/snapshot-changes.js)); khi offline, thay đổi chờ đến lúc có mạng mới đẩy.

### Thay đổi (Changed)
- **Không còn chớp số cũ**: khi mở app trên thiết bị đã đăng nhập và có mạng, màn hình hiện "Đang tải dữ liệu mới nhất…" đến khi nhận xong dữ liệu Cloud (tối đa 5 giây, sau đó hiện dữ liệu trên máy và tự cập nhật) ([js/ui/initial-sync-gate.js](../js/ui/initial-sync-gate.js)).

## [2.1.4] - 2026-11-14

### Sửa lỗi (Fixed)
- **Máy có dữ liệu cũ ghi đè Cloud**: lần đầu đăng nhập trên một thiết bị mà cả thiết bị và Cloud đều có dữ liệu, hộp thoại cũ có lựa chọn "Ghi đè Cloud" — chọn nhầm trên một máy còn dữ liệu cũ (cache trình duyệt) sẽ thay toàn bộ Cloud bằng dữ liệu cũ, xoá các khoản mới ghi ở máy khác, và máy khác nhận lại dữ liệu cũ đó. Nay luồng đăng nhập luôn tải file sao lưu dữ liệu của thiết bị trước, mặc định dùng dữ liệu Cloud, và không còn lựa chọn ghi đè Cloud ([js/services/cloud-session.js](../js/services/cloud-session.js)).
- **"Đẩy toàn bộ lên Cloud"** (Cài đặt) tự tải về file `QuanLyChiTieu_CloudBackup_….json` chứa dữ liệu Cloud hiện tại trước khi ghi đè; file này nhập lại được bằng "Khôi phục File (.json)".

## [2.1.3] - 2026-11-14

### Thay đổi (Changed)
- Bỏ "Số dư ban đầu" khỏi giao diện: form ví chỉ còn một ô **"Số dư hiện tại"** ("Dư nợ hiện tại" với thẻ tín dụng) cho cả tạo và sửa ví; thẻ ví không còn dòng số dư ban đầu. App vẫn lưu số dư ban đầu bên trong và tự tính từ số dư hiện tại người dùng nhập ([js/views/wallets/wallet-balance-field.js](../js/views/wallets/wallet-balance-field.js)); chỉ thay đổi khi người dùng thực sự sửa ô này.

## [2.1.2] - 2026-11-14

### Thêm mới (Added)
- **Khớp số dư thực tế**: khi sửa ví có ô "Số dư thực tế hiện tại" (thẻ tín dụng: "Dư nợ thực tế hiện tại"). Nhập số tiền đang có ngoài đời, app tự chỉnh số dư ban đầu theo chênh lệch ([js/domain/balance-reconcile.js](../js/domain/balance-reconcile.js)) nên số dư khớp ngay mà lịch sử giao dịch và báo cáo các tháng không đổi. Dùng khi bỏ app một thời gian rồi quay lại.

## [2.1.1] - 2026-11-14

### Thay đổi (Changed)
- Tự động tải lại ứng dụng khi bản phát hành mới được kích hoạt ([js/ui/sw-update.js](../js/ui/sw-update.js)): chỉ cần mở app một lần là lên bản mới (từ bản 2.1.1 trở đi). Lần cài đầu không tải lại; nếu đang mở form nhập liệu, app chờ đóng form rồi mới tải lại. App đã cài (PWA) tự kiểm tra bản mới mỗi khi được mở lại từ nền.

## [2.1.0] - 2026-11-14

### Thay đổi (Changed)
- **Bố cục & Điều hướng mới (App Shell & Navigation)**:
  - Khung giao diện responsive tối ưu: Desktop Sidebar cố định (≥1024px) và thanh điều hướng đáy mobile (Bottom Navigation Bar) đúng 5 mục: **Tổng quan · Giao dịch · [+] · Báo cáo · Thêm** với nút nổi FAB `+` chính giữa.
  - SPA Hash Router (`js/ui/router.js`) điều hướng qua `#/view` hashes (`#/dashboard`, `#/transactions`, `#/wallets`, `#/debts`, `#/budgets`, `#/analytics`, `#/settings`, `#/more`), hỗ trợ nút Back trình duyệt và đồng bộ trạng thái active.
- **Kiến trúc Màn hình dạng Class (`js/views/<screen>/`)**:
  - Tách thành các màn hình độc lập trong từng thư mục chuyên biệt: `dashboard`, `transactions`, `transaction-sheet`, `debt-sheet`, `wallets`, `debts`, `budgets`, `analytics`, `settings`, `more`.
  - Mỗi view là một class với `constructor(containerId)` và phương thức `render()`, tự động được router re-render khi màn hình được hiển thị.
- **Hỗ trợ 3 chế độ Theme (`js/ui/theme.js`)**:
  - Hỗ trợ đầy đủ Sáng (Light), Tối (Dark) và Theo hệ thống (System) với nút chuyển đổi nhanh trên giao diện, tự động thích ứng cấu hình hệ điều hành và cập nhật lại biểu đồ Chart.js khi đổi theme.

### Đã thêm (Added)
- **Quick-add Bottom Sheet (`js/views/transaction-sheet/`)**:
  - Ghi chép giao dịch nhanh chỉ trong ~3 chạm: nhập số tiền lớn (hero input) → chạm chọn hạng mục trên lưới icon (`category-grid`) → bấm Lưu.
  - Tự động ghi nhớ loại giao dịch và ví lựa chọn gần nhất (`last-entry.js`) cho lần nhập tiếp theo.
- **Tìm kiếm không dấu & Bộ lọc nâng cao**:
  - Tìm kiếm giao dịch không phân biệt dấu tiếng Việt (`normalizeVietnamese` trong `js/domain/transaction-query.js`).
  - Bottom sheet bộ lọc giao dịch chuyên sâu (`transactions-filter-sheet.js`): lọc theo khoảng thời gian linh hoạt (Hôm nay, Tuần này, Tháng này, Tháng trước, Toàn bộ), theo loại thu/chi/chuyển/nợ, theo hạng mục và theo ví.
  - Danh sách giao dịch gom nhóm trực quan theo từng ngày kèm tổng tiền ngày (`groupByDay` trong `js/domain/period-summary.js`).
- **Tầng Pure Domain Modules mở rộng**:
  - Bổ sung các module nghiệp vụ thuần túy có unit test 100%: `transaction-entry.js`, `period-summary.js`, `transaction-query.js`, `budget-progress.js`, `analytics-series.js`.

### Nội bộ & Tái cấu trúc (Internal)
- **Module hóa toàn diện (Modularization)**:
  - 100% file JavaScript trong toàn bộ dự án đều < 200 dòng code.
  - Xóa bỏ hoàn toàn mọi biến và instance toàn cục gắn trên `window.*` (`window.appInstance`, `window.transactionModal`, `window.setAppTheme`, `window.showToast`).
  - Tách `js/state.js` thành Thin Store kết hợp với các action modules trong `js/state/*` (`transaction-actions.js`, `wallet-actions.js`, `debt-actions.js`, `category-budget-actions.js`, `cloud-session-actions.js`, `persistence.js`).
  - Tách `js/services/firebase-sync.js` thành orchestrator kết hợp `firebase-sync-listeners.js`, `firebase-sync-ops.js`, `firebase-sync-pull.js`.
  - Tách `js/domain/sync-diff.js` thành re-export từ `record-hash.js`, `push-diff.js`, `remote-merge.js`.
  - Phân chia CSS rõ ràng theo trách nhiệm: `css/variables.css`, `css/ui.css`, `css/sheets.css`, `css/views/*.css`, `css/layouts.css`.

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
