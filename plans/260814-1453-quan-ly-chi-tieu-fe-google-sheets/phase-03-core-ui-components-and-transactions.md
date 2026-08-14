# Phase 03: Giao Dịch Thu Chi & Dashboard Tổng Quan

## Context Links
- Plan: [plan.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md)
- Phase 02: [phase-02-state-management-and-storage.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/phase-02-state-management-and-storage.md)

## Overview
- **Priority**: High (P0)
- **Current status**: Complete
- **Brief description**: Xây dựng Modal tạo/sửa giao dịch đa năng (Thu, Chi, Chuyển khoản giữa các ví), màn hình Dashboard hiển thị các thẻ thống kê tài chính, và Danh sách giao dịch kèm bộ lọc tìm kiếm linh hoạt.

## Key Insights
- Modal nhập giao dịch là thành phần người dùng tương tác nhiều nhất. Cần tối ưu thao tác: chọn loại (Chi / Thu / Chuyển), nhập số tiền có gợi ý phím tắt (10k, 50k, 100k, 500k, 1tr), chọn danh mục trực quan có icon và chọn ví thanh toán.
- Danh sách giao dịch gom nhóm theo ngày (Hôm nay, Hôm qua, Ngày cụ thể) để dễ theo dõi.
- Bộ lọc cho phép lọc theo tháng/năm, danh mục, ví và tìm kiếm từ khóa trong ghi chú.

## Requirements
- **Functional Requirements**:
  - Thêm / Sửa / Xóa giao dịch với xác nhận.
  - Phân loại 3 hình thức: Chi tiêu (Expense), Thu nhập (Income), Chuyển tiền giữa các ví (Transfer).
  - Thẻ Dashboard: Tổng số dư hiện có, Tổng thu tháng này, Tổng chi tháng này, Tiết kiệm ròng.
  - Bộ lọc giao dịch theo Thời gian (Hôm nay, Tuần này, Tháng này, Tháng trước, Tùy chọn), Danh mục, Ví và Search bar.
- **Non-functional Requirements**:
  - Modal mở mượt mà, tự động focus vào ô nhập số tiền.
  - Hỗ trợ phím Escape đóng modal, Enter để lưu.

## Architecture
- `js/components/transaction-modal.js`: Quản lý hiển thị và submit form giao dịch / chuyển khoản.
- `js/components/transaction-list.js`: Render danh sách giao dịch, xử lý tìm kiếm, phân trang/infinite scroll nhẹ và bộ lọc.
- `js/components/dashboard.js`: Render các thẻ thống kê tổng quan và top danh mục chi nhiều nhất.

## Related Code Files
- **Create**:
  - `js/components/transaction-modal.js`
  - `js/components/transaction-list.js`
  - `js/components/dashboard.js`
- **Modify**:
  - `index.html`
  - `css/components.css`
  - `js/app.js`

## Implementation Steps
1. Xây dựng component `transaction-modal.js` xử lý mở popup, chuyển tab Chi/Thu/Chuyển, validate số tiền.
2. Xây dựng component `dashboard.js` tính toán các chỉ số tài chính từ `state.js` và render thẻ tóm tắt.
3. Xây dựng component `transaction-list.js` hiển thị danh sách phân nhóm theo ngày, nút chỉnh sửa/xóa nhanh.
4. Tích hợp bộ lọc thời gian và thanh tìm kiếm vào `transaction-list.js`.
5. Đăng ký listeners trong `app.js` để đồng bộ UI khi người dùng tạo/sửa/xóa giao dịch.

## Todo List
- [x] Xây dựng Modal Nhập Giao Dịch (`transaction-modal.js`)
- [x] Xây dựng Thẻ Thống Kê Tổng Quan (`dashboard.js`)
- [x] Xây dựng Danh Sách Giao Dịch gom nhóm theo ngày (`transaction-list.js`)
- [x] Xây dựng Bộ Lọc & Tìm Kiếm Giao Dịch
- [x] Kiểm thử luồng Thêm / Sửa / Xóa giao dịch và cập nhật số dư

## Success Criteria
- Thêm giao dịch thành công trong < 3 giây thao tác.
- Danh sách giao dịch và số dư thẻ Dashboard cập nhật tức thì.

## Risk Assessment & Mitigation
- **Rủi ro**: Lỗi nhập số tiền định dạng có dấu chấm/phẩy dẫn đến sai số (NaN).
- **Giải pháp**: Xử lý input mask tự động định dạng số tiền VNĐ khi người dùng đang gõ.

## Security Considerations
- Sanitize chuỗi ghi chú (Note) để tránh XSS khi render ra HTML.

## Next Steps
- Chuyển sang Phase 04: Xây dựng Quản Lý Ví & Ngân Sách Hạn Mức.
