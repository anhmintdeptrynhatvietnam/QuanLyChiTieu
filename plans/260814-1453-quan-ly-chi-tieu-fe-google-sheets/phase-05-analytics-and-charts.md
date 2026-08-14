# Phase 05: Biểu Đồ & Báo Cáo Phân Tích (Chart.js)

## Context Links
- Plan: [plan.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md)
- Phase 03: [phase-03-core-ui-components-and-transactions.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/phase-03-core-ui-components-and-transactions.md)

## Overview
- **Priority**: Medium (P1)
- **Current status**: Complete
- **Brief description**: Tích hợp thư viện Chart.js để vẽ các biểu đồ phân tích tài chính chuyên sâu: Biểu đồ tròn/Doughnut cơ cấu chi tiêu theo danh mục, Biểu đồ cột/đường xu hướng thu chi qua các tháng và bảng xếp hạng chi tiêu.

## Key Insights
- Biểu đồ Doughnut cần hiển thị rõ nhãn phần trăm (%) khi hover hoặc tương tác trên mobile.
- Biểu đồ Bar/Line cần so sánh song song Thu nhập vs Chi tiêu trong 6 tháng gần nhất để người dùng đánh giá dòng tiền dương hay âm.
- Cần dọn dẹp (destroy) instance Chart.js cũ khi re-render hoặc đổi theme Dark/Light để tránh memory leak.

## Requirements
- **Functional Requirements**:
  - Biểu đồ 1 (Doughnut Chart): Tỷ trọng chi tiêu theo danh mục trong tháng được chọn.
  - Biểu đồ 2 (Bar/Line Chart): Xu hướng Thu nhập vs Chi tiêu theo 6 tháng gần nhất.
  - Biểu đồ 3 (Category Breakdown): Chi tiết từng danh mục (Số tiền, %, số lượng giao dịch).
  - Bộ chọn thời gian phân tích: Tháng này, Tháng trước, Năm nay, Tùy chỉnh.
- **Non-functional Requirements**:
  - Animation vẽ biểu đồ mượt mà, hỗ trợ tương tác cảm ứng tốt trên điện thoại.
  - Màu sắc biểu đồ tự động thích ứng với bảng màu Dark / Light mode.

## Architecture
- `js/components/analytics.js`: Thu thập dữ liệu từ State, tổng hợp số liệu theo nhóm/tháng, khởi tạo và cập nhật Chart.js instances.

## Related Code Files
- **Create**:
  - `js/components/analytics.js`
- **Modify**:
  - `index.html`
  - `css/components.css`
  - `js/app.js`

## Implementation Steps
1. Nạp thư viện Chart.js qua CDN trong `index.html`.
2. Xây dựng module `analytics.js` với các hàm trích xuất dữ liệu: `getExpenseByCategory()`, `getIncomeVsExpenseTrend()`.
3. Khởi tạo biểu đồ Doughnut cơ cấu chi tiêu với bảng màu hài hòa (Tailwind-like palette).
4. Khởi tạo biểu đồ cột kép so sánh Thu vs Chi theo từng tháng.
5. Xử lý sự kiện thay đổi theme Dark/Light để cập nhật màu trục, lưới và nhãn của Chart.js.
6. Xử lý responsive tự co giãn kích thước canvas biểu đồ trên mobile.

## Todo List
- [x] Tích hợp Chart.js CDN và cấu hình mặc định (font, responsive)
- [x] Xây dựng Biểu đồ Doughnut cơ cấu chi tiêu theo danh mục
- [x] Xây dựng Biểu đồ Cột Thu vs Chi qua các tháng
- [x] Xây dựng Bảng phân tích chi tiết từng danh mục
- [x] Xử lý cập nhật biểu đồ khi chuyển Dark/Light theme

## Success Criteria
- Biểu đồ hiển thị sắc nét, tương tác tooltip hiển thị đầy đủ số tiền định dạng VNĐ và tỷ lệ %.
- Không bị lỗi đè canvas khi người dùng chuyển đổi qua lại giữa các tab.

## Risk Assessment & Mitigation
- **Rủi ro**: Lỗi render canvas khi container đang bị ẩn (`display: none`).
- **Giải pháp**: Chỉ khởi tạo / cập nhật biểu đồ khi tab Báo cáo hoặc Dashboard đang active (visible).

## Security Considerations
- Không gửi dữ liệu tài chính ra ngoài, toàn bộ tính toán xử lý 100% tại trình duyệt.

## Next Steps
- Chuyển sang Phase 06: Đồng Bộ Google Sheets API & Quản Trị Backup/Restore.
