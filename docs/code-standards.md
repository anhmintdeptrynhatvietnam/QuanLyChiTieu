# Code Standards

Tài liệu quy định các tiêu chuẩn lập trình, cấu trúc thư mục, quy tắc bảo mật và quy ước mã nguồn cho dự án Sổ Thu Chi.

---

## 1. Quy Định Đặt Tên & Tổ Chức File

- **Tên file**: Sử dụng chuẩn `kebab-case` cho toàn bộ tên file mã nguồn (ví dụ: `ledger.js`, `firebase-sync.js`, `transaction-modal.js`, `variables.css`). Tên file cần mang ý nghĩa rõ ràng, mô tả đúng chức năng của module.
- **Kích thước file**: 
  - Tiêu chuẩn chung là hướng tới giữ mỗi file mã nguồn dưới ~200 dòng để tối ưu khả năng đọc hiểu và quản lý ngữ cảnh.
  - *Lưu ý về ngoại lệ đã biết*: Một số file hiện tại trong dự án đang có kích thước lớn hơn mức này; các file này sẽ được chia nhỏ thành các sub-module chuyên biệt trong đợt tái cấu trúc giao diện (UI redesign) sắp tới.
- **Không dùng framework nặng**: Tận dụng triệt để Vanilla JavaScript ES Modules (`import`/`export`), HTML5 Semantic và Modern CSS3. Không sử dụng thư viện đóng gói hay framework trung gian.

---

## 2. Quy Tắc Module Nghiệp Vụ Thuần Túy (Domain Modules)

- Toàn bộ module nằm trong thư mục [js/domain/](../js/domain/) phải tuân thủ nghiêm ngặt nguyên tắc **Pure Functions & Zero Imports**:
  - Không được import bất kỳ thư viện bên ngoài hay module nào khác.
  - Không phụ thuộc vào môi trường trình duyệt: không thao tác DOM (`document`, `window`), không gọi `localStorage`, không phụ thuộc vào `Firebase` hay mạng.
- **Kiểm thử bắt buộc**: Mọi hàm trong tầng domain phải có unit test bao phủ đầy đủ các trường hợp biên trong thư mục `tests/` và chạy thông qua lệnh:
  ```bash
  node --test "tests/*.test.mjs"
  ```

---

## 3. Tiêu Chuẩn JavaScript & Định Dạng Dữ Liệu

- Sử dụng chuẩn ECMAScript hiện đại: `const`, `let`, arrow functions, async/await, optional chaining (`?.`), nullish coalescing (`??`).
- **Quy tắc ngày tháng**:
  - **Lưu trữ**: Ngày tháng luôn được lưu trữ dưới dạng chuỗi chuẩn ISO không giờ: `YYYY-MM-DD` (ví dụ: `2026-11-14`).
  - **Hiển thị**: Khi hiển thị lên giao diện người dùng, luôn định dạng theo chuẩn Việt Nam: `DD/MM/YYYY` (ví dụ: `14/11/2026`) thông qua các hàm tiện ích trong [js/utils/formatters.js](../js/utils/formatters.js).
- **Quy tắc tiền tệ**:
  - Tiền tệ hiển thị theo chuẩn Việt Nam Đồng: `###.###.### ₫` (ví dụ: `150.000 ₫`, `1.500.000 ₫`) thông qua hàm `formatCurrency()`.
- **Xử lý lỗi**:
  - Luôn bọc các thao tác đọc/ghi `localStorage` và các lệnh gọi API Firebase trong khối `try...catch` để xử lý ngoại lệ an toàn và thông báo lỗi thân thiện tới người dùng qua Toast.
- **Tách biệt trách nhiệm**:
  - Giao diện người dùng (`js/components/`) chỉ phụ trách hiển thị và bắt sự kiện.
  - Quản lý trạng thái tập trung trong `js/state.js`.
  - Logic tính toán số dư, quy tắc nợ, merge đồng bộ nằm ở `js/domain/`.
  - Tương tác đám mây nằm ở `js/services/`.

---

## 4. Tiêu Chuẩn PWA & Quản Lý Cache

- **Đăng ký tài nguyên cache**:
  - Mọi file tĩnh mới được tạo trong các thư mục `js/`, `css/`, `assets/icons/` bắt buộc phải được khai báo vào mảng `ASSETS_TO_CACHE` trong [sw.js](../sw.js).
  - Quy tắc này được kiểm tra tự động qua bài test [tests/sw-assets.test.mjs](../tests/sw-assets.test.mjs). Test suite sẽ báo lỗi và chặn kiểm thử nếu có bất kỳ file thực tế nào trên đĩa bị bỏ sót khỏi danh sách cache.
- **Cập nhật phiên bản Cache**:
  - Sau mỗi lần phát hành hoặc sửa đổi mã nguồn, bắt buộc phải tăng định danh `CACHE_NAME` trong [sw.js](../sw.js) (ví dụ: `qlct-pwa-v2.7` lên `qlct-pwa-v2.8`) để đảm bảo Service Worker kích hoạt xóa cache cũ và nạp bản mới.
- **Ghim phiên bản thư viện CDN**:
  - Các thư viện bên ngoài nạp qua CDN phải được ghim phiên bản cụ thể (Lucide 1.72.0, Chart.js 4.6.1) và được lưu cache tại `qlct-cdn-v1`.

---

## 5. Tiêu Chuẩn Bảo Mật & Phòng Chống XSS

- **Render HTML an toàn**:
  - Khi hiển thị nội dung động do người dùng nhập hoặc từ dữ liệu bên ngoài (tên hạng mục, tên ví, ghi chú giao dịch, tên người vay/nợ, tên hiển thị người dùng), **bắt buộc** phải chuyển đổi qua hàm `escapeHtml()` trong [js/utils/helpers.js](../js/utils/helpers.js) hoặc gán thông qua thuộc tính `element.textContent`.
  - Nghiêm cấm việc ghép nối chuỗi HTML thô chưa qua sanitize vào `innerHTML`.
- **Lưu trữ dữ liệu**:
  - Dữ liệu ứng dụng chỉ lưu trữ tại `localStorage` trình duyệt (khóa `qlct_*`) và Firebase Firestore của chính người dùng. Ứng dụng không trực tiếp sử dụng IndexedDB (chỉ có Firebase SDK sử dụng IndexedDB nội bộ).
  - Không lưu trữ Secret Key hay Private Token trong mã nguồn client.
- **Quy tắc phân quyền Cloud**:
  - Tuân thủ cấu hình trong [firestore.rules](../firestore.rules): mỗi người dùng chỉ có quyền đọc/ghi trên cây tài liệu `users/{uid}/**` tương ứng với UID đã được xác thực của mình.
