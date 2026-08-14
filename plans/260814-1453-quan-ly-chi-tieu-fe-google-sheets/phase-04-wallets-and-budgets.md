# Phase 04: Quản Lý Ví & Ngân Sách Hạn Mức

## Context Links
- Plan: [plan.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md)
- Phase 03: [phase-03-core-ui-components-and-transactions.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/phase-03-core-ui-components-and-transactions.md)

## Overview
- **Priority**: Medium (P1)
- **Current status**: Complete
- **Brief description**: Xây dựng module Quản lý nhiều Ví / Tài khoản tài chính (Tiền mặt, Ngân hàng, Thẻ tín dụng, Tiết kiệm) và Module Ngân sách (Đặt hạn mức chi tiêu theo danh mục kèm thanh tiến độ cảnh báo màu sắc).

## Key Insights
- Người dùng thường có nhiều nguồn tiền (Ví tiền mặt, tài khoản VCB/MB, thẻ tín dụng). Quản lý ví giúp biết chính xác tiền đang nằm ở đâu.
- Quản lý Ngân sách (Budgeting) là tính năng cốt lõi giúp kiểm soát chi tiêu: Hiển thị rõ số tiền đã chi vs số tiền hạn mức, tỷ lệ phần trăm và đổi màu cảnh báo (Xanh lá < 70%, Vàng 70-90%, Đỏ > 90% hoặc vượt ngân sách).

## Requirements
- **Functional Requirements**:
  - **Quản lý Ví**: Tạo mới ví, sửa tên/icon/màu sắc, điều chỉnh số dư ban đầu, xóa ví (nếu không có giao dịch).
  - **Chuyển tiền**: Thao tác chuyển tiền nhanh giữa các ví (Ví nguồn -> Ví đích).
  - **Ngân sách**: Thiết lập hạn mức chi tiêu cho từng danh mục theo tháng.
  - **Cảnh báo**: Thanh tiến độ trực quan hiển thị % đã chi, số tiền còn lại có thể chi trong tháng.
- **Non-functional Requirements**:
  - Giao diện trực quan dạng Grid thẻ ví và thẻ ngân sách.

## Architecture
- `js/components/wallets.js`: Quản lý danh sách ví, modal thêm/sửa ví, lịch sử giao dịch theo từng ví.
- `js/components/budgets.js`: Quản lý danh sách hạn mức ngân sách, modal thiết lập ngân sách theo tháng.

## Related Code Files
- **Create**:
  - `js/components/wallets.js`
  - `js/components/budgets.js`
- **Modify**:
  - `index.html`
  - `css/components.css`
  - `js/app.js`

## Implementation Steps
1. Xây dựng component `wallets.js` render danh sách ví kèm số dư và nút Thêm/Sửa ví.
2. Xử lý logic Chuyển tiền giữa các ví (tạo bản ghi `transfer` trong State).
3. Xây dựng component `budgets.js` tính toán tổng chi tiêu của danh mục trong tháng so với hạn mức đã cài đặt.
4. Render thanh tiến độ động với màu sắc tương ứng mức độ cảnh báo (Green / Amber / Red).
5. Tích hợp hiển thị tóm tắt ngân sách trên màn hình Dashboard chính.

## Todo List
- [x] Xây dựng giao diện Quản Lý Ví (`wallets.js`)
- [x] Xây dựng Modal Thêm/Sửa Ví
- [x] Xây dựng giao diện Quản Lý Ngân Sách (`budgets.js`)
- [x] Xây dựng Modal Thiết Lập Hạn Mức Ngân Sách
- [x] Tích hợp thanh tiến độ ngân sách và cảnh báo vượt mức

## Success Criteria
- Thêm/sửa ví và chuyển tiền giữa các ví hoạt động chính xác.
- Thanh tiến độ ngân sách cập nhật ngay khi có giao dịch mới thuộc danh mục đó.

## Risk Assessment & Mitigation
- **Rủi ro**: Tháng mới chưa có cài đặt ngân sách.
- **Giải pháp**: Cung cấp nút "Sao chép ngân sách từ tháng trước" để người dùng không phải nhập lại từ đầu.

## Security Considerations
- Đảm bảo tính toán số học chính xác, tránh làm tròn sai lệch số dư ví.

## Next Steps
- Chuyển sang Phase 05: Tích hợp Biểu Đồ & Báo Cáo Phân Tích (Chart.js).
