# Code Standards

## 1. Quy Định Đặt Tên & Tổ Chức File
- **Tên file**: Sử dụng chuẩn `kebab-case` (ví dụ: `google-sheets.js`, `transaction-modal.js`, `variables.css`).
- **Kích thước file**: Giữ mỗi file mã nguồn dưới 200 dòng. Khi file phình to, tách thành các module/sub-components nhỏ hơn.
- **Không dùng framework nặng**: Tận dụng triệt để Vanilla JavaScript ES Modules (`import`/`export`), HTML5 Semantic và Modern CSS3.

## 2. Tiêu Chuẩn JavaScript
- Sử dụng chuẩn ES6+ (`const`, `let`, arrow functions, async/await, optional chaining `?.`).
- Sử dụng mô hình xử lý lỗi `try...catch` ở tất cả các hàm đọc/ghi Storage và gọi Google API.
- Định dạng ngày tháng theo chuẩn `DD/MM/YYYY` và tiền tệ theo định dạng Việt Nam Đồng `###.###.### ₫`.
- Tách biệt rõ ràng giữa Business Logic (`state.js`, `services/`) và UI Components (`components/`).

## 3. Tiêu Chuẩn CSS & Giao Diện
- Dùng CSS Custom Properties (CSS Variables) đặt trong `css/variables.css` cho toàn bộ mã màu, font-size, border-radius, shadows.
- Hỗ trợ đầy đủ 2 theme: `Light Theme` (mặc định) và `Dark Theme` (thông qua `[data-theme="dark"]`).
- Responsive:
  - Mobile: Màn hình `< 768px` (Ẩn Sidebar, Hiện Bottom Navigation Bar, FAB Button).
  - Desktop: Màn hình `>= 768px` (Hiện Sidebar bên trái, Ẩn Bottom Navigation Bar).

## 4. Bảo Mật & Quyền Riêng Tư
- Dữ liệu người dùng lưu trữ 100% tại trình duyệt và Google Drive cá nhân của người dùng.
- Không lưu trữ bất kỳ Secret Key nào trong client code.
- Escape/Sanitize dữ liệu chuỗi ghi chú người dùng nhập để phòng chống tấn công XSS.
