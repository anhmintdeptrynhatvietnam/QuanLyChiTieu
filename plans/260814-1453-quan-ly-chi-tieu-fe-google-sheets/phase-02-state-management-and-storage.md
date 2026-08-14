# Phase 02: State Management & Local Storage Engine

## Context Links
- Plan: [plan.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md)
- Phase 01: [phase-01-setup-project-and-design-tokens.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/phase-01-setup-project-and-design-tokens.md)

## Overview
- **Priority**: High (P0)
- **Current status**: Complete
- **Brief description**: Xây dựng kiến trúc quản lý trạng thái tập trung (Reactive State Store với Pub/Sub pattern), bộ nhớ cục bộ Offline-First qua IndexedDB / LocalStorage, và bộ dữ liệu danh mục & ví ban đầu chuẩn Việt Nam.

## Key Insights
- Sử dụng mô hình Pub/Sub đơn giản trong Vanilla JS để các components (Dashboard, List, Wallets, Budgets) tự động cập nhật khi state thay đổi mà không cần re-render toàn bộ DOM.
- Tách biệt tầng Storage (`storage.js`) để hỗ trợ chuyển đổi linh hoạt giữa LocalStorage/IndexedDB và sẵn sàng đồng bộ với Google Sheets.
- Khởi tạo sẵn danh mục chi tiêu thực tế (Ăn uống, Đi lại, Mua sắm, Hóa đơn, Tiền lương, Thưởng...) và các ví mặc định (Tiền mặt, Tài khoản ngân hàng, Thẻ tín dụng).

## Requirements
- **Functional Requirements**:
  - CRUD operations cho Transactions, Wallets, Categories, Budgets, Settings.
  - Tự động tính toán số dư ví khi thêm/sửa/xóa giao dịch hoặc chuyển khoản.
  - Phát sự kiện `stateChanged` đến tất cả subscribers đăng ký theo dõi.
- **Non-functional Requirements**:
  - Thao tác đọc/ghi local diễn ra tức thì (< 5ms).
  - Tự động khôi phục dữ liệu mặc định nếu là lần đầu truy cập.

## Architecture
- `js/config.js`: Khởi tạo danh mục mẫu, ví mẫu, icon mappings, cấu hình tiền tệ.
- `js/services/storage.js`: Wrapper lưu trữ an toàn (bắt lỗi try/catch dung lượng quota) trên `localStorage` / `IndexedDB`.
- `js/state.js`: Chứa `AppState` tập trung, các hàm `getState()`, `setState()`, `subscribe()`, `addTransaction()`, `updateTransaction()`, `deleteTransaction()`, `transferFunds()`, v.v.

## Related Code Files
- **Create**:
  - `js/config.js`
  - `js/services/storage.js`
  - `js/state.js`
  - `js/utils/helpers.js`
  - `js/utils/formatters.js`

## Implementation Steps
1. Tạo `js/config.js` định nghĩa danh mục chi tiêu / thu nhập chuẩn với icon Lucide tương ứng.
2. Viết `js/utils/formatters.js` (hàm format số tiền VNĐ, định dạng ngày DD/MM/YYYY, parse số).
3. Viết `js/utils/helpers.js` (tạo UUID v4, debounce, date range filters).
4. Viết `js/services/storage.js` xử lý đọc/ghi JSON an toàn vào localStorage.
5. Viết `js/state.js` xây dựng Store với đầy đủ các action xử lý logic nghiệp vụ tài chính.
6. Viết kiểm thử đơn vị nhanh trong console để xác minh việc tính toán số dư ví.

## Todo List
- [x] Xây dựng `js/config.js` với các danh mục và ví mặc định
- [x] Xây dựng `js/utils/formatters.js` và `js/utils/helpers.js`
- [x] Xây dựng `js/services/storage.js`
- [x] Xây dựng `js/state.js` với Pub/Sub và business logic CRUD
- [x] Xác minh tính toán số dư ví khi thêm giao dịch Thu / Chi / Chuyển khoản

## Success Criteria
- Dữ liệu lưu trữ ổn định trên trình duyệt, không bị mất khi F5 tải lại trang.
- Các hàm CRUD hoạt động chính xác, số dư ví cập nhật đúng 100%.

## Risk Assessment & Mitigation
- **Rủi ro**: Lỗi vượt quota LocalStorage nếu lưu nhiều dữ liệu.
- **Giải pháp**: Tối ưu cấu trúc JSON tinh gọn, dọn dẹp cache thừa và sẵn sàng chuyển sang IndexedDB nếu dữ liệu lớn.

## Security Considerations
- Validate dữ liệu đầu vào (số tiền không âm, ngày hợp lệ) trước khi lưu vào State.

## Next Steps
- Chuyển sang Phase 03: Xây dựng Giao diện Nhập liệu Thu Chi & Dashboard.
