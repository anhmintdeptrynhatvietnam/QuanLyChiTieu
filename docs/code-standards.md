# Code Standards

Tài liệu quy định các tiêu chuẩn lập trình, cấu trúc thư mục, quy tắc bảo mật và quy ước mã nguồn cho dự án Sổ Thu Chi.

---

## 1. Quy Định Đặt Tên, Kích Thước & Tổ Chức File

- **Tên file**: Sử dụng chuẩn `kebab-case` cho toàn bộ tên file mã nguồn (ví dụ: `ledger.js`, `firebase-sync.js`, `transaction-sheet.js`, `variables.css`). Tên file cần mang ý nghĩa rõ ràng, mô tả đúng chức năng của module.
- **Kích thước file**: 
  - **Quy tắc tuyệt đối**: Mọi file mã nguồn JavaScript (`js/**/*.js`) bắt buộc phải **dưới 200 dòng**. Không có ngoại lệ.
  - Khi một module tiếp cận ngưỡng 200 dòng, bắt buộc phải phân tách thành các sub-module chuyên biệt theo nguyên tắc trách nhiệm đơn lẻ (Single Responsibility Principle).
- **Không dùng biến toàn cục trên `window.*`**:
  - Tuyệt đối không gắn bất kỳ biến trạng thái, hàm xử lý hay instance nào của ứng dụng lên `window` toàn cục (không còn `window.appInstance`, `window.transactionModal`, `window.setAppTheme`, `window.getAppTheme`, `window.showToast`...).
  - Mọi tương tác, truyền nhận dữ liệu giữa các module phải sử dụng cơ chế ES Modules (`import`/`export`) và kiến trúc Reactive Store Pub/Sub (`stateStore`).
- **Không dùng framework nặng**: Tận dụng triệt để Vanilla JavaScript ES Modules (`import`/`export`), HTML5 Semantic và Modern CSS3. Không sử dụng thư viện đóng gói hay framework trung gian.

---

## 2. Phân Tầng Trách Nhiệm Module: `js/ui/` vs `js/views/` vs `js/domain/`

Dự án phân chia ranh giới rõ ràng giữa các tầng mã nguồn JavaScript:

### 2.1. Tầng Khối Dựng UI Dùng Chung (`js/ui/`)
- Chứa các thành phần giao diện, tiện ích tương tác và nguyên mẫu UI tái sử dụng trên nhiều màn hình.
- **Các thành phần chuẩn**:
  - `theme.js`: Quản lý 3 chế độ giao diện: Sáng (Light), Tối (Dark) và Theo hệ thống (System).
  - `bottom-sheet.js`: Khối dựng modal trượt đáy (bottom sheet) với animation mở/đóng, kéo trượt và quản lý focus accessibility.
  - `currency-input.js`: Định dạng tiền tệ thời gian thực khi nhập liệu (hỗ trợ hero input số lớn).
  - `category-grid.js`: Lưới danh mục hiển thị màu sắc và biểu tượng trực quan, hỗ trợ chọn nhanh 1 chạm.
  - `wallet-picker.js`: Thành phần chọn ví nguồn và ví đích.
  - `router.js`: SPA Hash Router quản lý chuyển đổi view qua `location.hash` (`#/dashboard`, `#/transactions`, `#/wallets`, `#/debts`, `#/budgets`, `#/analytics`, `#/settings`, `#/more`).
  - `sync-badge.js`: Huy hiệu đồng bộ trạng thái kết nối Cloud trên header.
  - `transaction-row.js`: Dòng giao dịch chuẩn hóa với biểu tượng danh mục, số tiền, ngày tháng và sự kiện click mở sửa giao dịch.
  - `icons.js`: Tiện ích kích hoạt render Lucide icons.
- **Quy tắc**: Không chứa logic tính toán nghiệp vụ hay lưu trữ state riêng biệt của một màn hình cụ thể.

### 2.2. Tầng Màn Hình Giao Diện (`js/views/<screen>/`)
- Mỗi màn hình được đóng gói trong một thư mục con riêng biệt dưới `js/views/`:
  - `dashboard/`: Màn hình Tổng quan (hero balance card, tổng thu/chi tháng, cảnh báo nợ/ngân sách, giao dịch gần đây).
  - `transactions/`: Màn hình Danh sách giao dịch (tìm kiếm không phân biệt dấu, filter sheet, gom nhóm theo ngày).
  - `transaction-sheet/`: Bottom sheet ghi chép giao dịch nhanh trong 3 chạm (nhập số tiền → chọn hạng mục → lưu, ghi nhớ loại/ví qua `last-entry.js`).
  - `debt-sheet/`: Bottom sheet quản lý và ghi chép sổ vay nợ.
  - `wallets/`: Màn hình quản lý danh sách ví và tài khoản.
  - `debts/`: Màn hình sổ nợ (Cho vay / Đi vay) và tiến độ hoàn trả.
  - `budgets/`: Màn hình hạn mức ngân sách tháng và cảnh báo.
  - `analytics/`: Màn hình báo cáo phân tích thu chi qua biểu đồ Chart.js.
  - `settings/`: Màn hình cài đặt tài khoản Firebase, cấu hình Cloud, theme và sao lưu dữ liệu.
  - `more/`: Màn hình điều hướng phụ trên mobile dẫn tới các mục thứ cấp.
- **Quy tắc cấu trúc View Class**:
  - Mỗi view chính phải là một class nhận ID vùng chứa: `constructor(containerId)` và triển khai phương thức `render()`.
  - Phương thức `render()` được router (`js/ui/router.js`) tự động gọi lại mỗi khi màn hình được kích hoạt hiển thị để đảm bảo dữ liệu luôn tươi mới.
  - Khi code trong một view tiếp cận ngưỡng 200 dòng, phải chia nhỏ thành các file render phụ trong cùng thư mục view (ví dụ: `dashboard-cards.js`, `transactions-header.js`, `transactions-list-renderer.js`, `transactions-filter-sheet.js`).

### 2.3. Tầng Nghiệp Vụ Thuần Túy (`js/domain/`)
- Toàn bộ module trong [js/domain/](../js/domain/) phải tuân thủ nghiêm ngặt nguyên tắc **Pure Functions & Zero Imports**:
  - Không được import bất kỳ thư viện bên ngoài hay module nào khác.
  - Không phụ thuộc vào môi trường trình duyệt: không thao tác DOM (`document`, `window`), không gọi `localStorage`, không phụ thuộc vào `Firebase` hay mạng.
- Gồm: `ledger.js`, `debt-rules.js`, `sync-diff.js` (re-exports `record-hash.js`, `push-diff.js`, `remote-merge.js`), `transaction-entry.js`, `period-summary.js`, `transaction-query.js`, `budget-progress.js`, `analytics-series.js`, `legacy-migration.js`, `account-switch.js`, `settings-migration.js`, `export-sanitize.js`.
- **Kiểm thử bắt buộc**: Mọi hàm trong tầng domain phải có unit test bao phủ đầy đủ các trường hợp biên trong thư mục `tests/` và chạy thông qua lệnh:
  ```bash
  node --test "tests/*.test.mjs"
  ```

---

## 3. Quy Tắc Tổ Chức & Vị Trí File CSS

Toàn bộ CSS được tổ chức theo module hóa rõ ràng trong thư mục `css/`:
- `css/variables.css`: Khai báo Design Tokens, biến màu sắc cho 2 chế độ Sáng / Tối (`[data-theme="dark"]`), biến khoảng cách spacing, radius, typography, chiều cao header và mobile nav.
- `css/base.css`: CSS Reset chuẩn, thiết lập kiểu font chữ toàn cục và kiểu dáng cơ bản của các phần tử form.
- `css/layouts.css`: Khung cấu trúc ứng dụng (App Shell) và responsive breakpoints:
  - Desktop (≥1024px): Cột Sidebar cố định bên trái, ẩn mobile nav.
  - Mobile (<1024px): Ẩn Sidebar, hiển thị thanh điều hướng đáy (Bottom Navigation Bar) đúng 5 mục: **Tổng quan · Giao dịch · [+] · Báo cáo · Thêm** với nút `+` (FAB) nổi bật ở giữa.
- `css/ui.css`: Kiểu dáng cho các thành phần giao diện dùng chung (buttons, inputs, cards, badges, transaction rows, category grids, sync status).
- `css/sheets.css`: Kiểu dáng cho toàn bộ hệ thống Bottom Sheet / Modal (hiệu ứng trượt, backdrop mờ, sheet-header, sheet-body, sheet-footer).
- `css/views/*.css`: Kiểu dáng đặc thù riêng cho từng màn hình (`dashboard.css`, `transactions.css`, `wallets.css`, `debts.css`, `budgets.css`, `analytics.css`, `settings.css`). Tuyệt đối không viết CSS màn hình vào `base.css` hay `layouts.css`.

---

## 4. Tiêu Chuẩn JavaScript & Định Dạng Dữ Liệu

- Sử dụng chuẩn ECMAScript hiện đại: `const`, `let`, arrow functions, async/await, optional chaining (`?.`), nullish coalescing (`??`).
- **Quy tắc ngày tháng**:
  - **Lưu trữ**: Ngày tháng luôn được lưu trữ dưới dạng chuỗi chuẩn ISO không giờ: `YYYY-MM-DD` (ví dụ: `2026-11-14`).
  - **Hiển thị**: Khi hiển thị lên giao diện người dùng, luôn định dạng theo chuẩn Việt Nam: `DD/MM/YYYY` (ví dụ: `14/11/2026`) thông qua các hàm tiện ích trong [js/utils/formatters.js](../js/utils/formatters.js).
- **Quy tắc tiền tệ**:
  - Tiền tệ hiển thị theo chuẩn Việt Nam Đồng: `###.###.### ₫` (ví dụ: `150.000 ₫`, `1.500.000 ₫`) thông qua hàm `formatCurrency()`.
- **Xử lý lỗi**:
  - Luôn bọc các thao tác đọc/ghi `localStorage` và các lệnh gọi API Firebase trong khối `try...catch` để xử lý ngoại lệ an toàn và thông báo lỗi thân thiện tới người dùng qua Toast.
- **Tách biệt trách nhiệm**:
  - Màn hình giao diện (`js/views/`) và thành phần UI (`js/ui/`) chỉ phụ trách hiển thị và bắt sự kiện.
  - Quản lý trạng thái tập trung trong `js/state.js` và `js/state/*`.
  - Logic tính toán số dư, quy tắc nợ, merge đồng bộ nằm ở `js/domain/`.
  - Tương tác đám mây nằm ở `js/services/`.

---

## 5. Tiêu Chuẩn PWA & Quản Lý Cache

- **Đăng ký tài nguyên cache bắt buộc**:
  - Mọi file tĩnh mới được tạo trong các thư mục `js/`, `css/`, `assets/icons/` **bắt buộc** phải được khai báo vào mảng `ASSETS_TO_CACHE` trong [sw.js](../sw.js).
  - Quy tắc này được kiểm tra tự động và cưỡng chế qua bài test [tests/sw-assets.test.mjs](../tests/sw-assets.test.mjs). Test suite sẽ báo lỗi và chặn hoàn thành nếu có bất kỳ file thực tế nào trên đĩa bị bỏ sót khỏi danh sách cache hoặc có file khai báo mà không tồn tại.
- **Cập nhật phiên bản Cache**:
  - Sau mỗi lần phát hành hoặc sửa đổi mã nguồn, bắt buộc phải tăng định danh `CACHE_NAME` trong [sw.js](../sw.js) (ví dụ: `qlct-pwa-v2.15` lên `qlct-pwa-v2.16`) để đảm bảo Service Worker kích hoạt xóa cache cũ và nạp bản mới.
- **Ghim phiên bản thư viện CDN**:
  - Các thư viện bên ngoài nạp qua CDN phải được ghim phiên bản cụ thể (Lucide 1.72.0, Chart.js 4.6.1) và được lưu cache tại `qlct-cdn-v1`.

---

## 6. Tiêu Chuẩn Bảo Mật & Phòng Chống XSS

- **Render HTML an toàn**:
  - Khi hiển thị nội dung động do người dùng nhập hoặc từ dữ liệu bên ngoài (tên hạng mục, tên ví, ghi chú giao dịch, tên người vay/nợ, tên hiển thị người dùng), **bắt buộc** phải chuyển đổi qua hàm `escapeHtml()` trong [js/utils/helpers.js](../js/utils/helpers.js) hoặc gán thông qua thuộc tính `element.textContent`.
  - Nghiêm cấm việc ghép nối chuỗi HTML thô chưa qua sanitize vào `innerHTML`.
- **Lưu trữ dữ liệu**:
  - Dữ liệu ứng dụng chỉ lưu trữ tại `localStorage` trình duyệt (khóa `qlct_*`) và Firebase Firestore của chính người dùng. Ứng dụng không trực tiếp sử dụng IndexedDB (chỉ có Firebase SDK sử dụng IndexedDB nội bộ).
  - Không lưu trữ Secret Key hay Private Token trong mã nguồn client.
- **Quy tắc phân quyền Cloud**:
  - Tuân thủ cấu hình trong [firestore.rules](../firestore.rules): mỗi người dùng chỉ có quyền đọc/ghi trên cây tài liệu `users/{uid}/**` tương ứng với UID đã được xác thực của mình.
