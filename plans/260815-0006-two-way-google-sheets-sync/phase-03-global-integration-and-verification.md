---
phase: 3
title: "Kết nối Nút Đồng Bộ Toàn Cục & Kiểm Thử Toàn Diện"
status: completed
priority: P2
effort: "1h"
dependencies: [1, 2]
---

# Phase 03: Kết nối Nút Đồng Bộ Toàn Cục & Kiểm Thử Toàn Diện

## Overview
Gắn nút/sự kiện Đồng Bộ toàn cục (Header button, Mobile Quick Actions) kích hoạt Modal Lựa Chọn Đồng Bộ, kiểm tra toàn diện quy trình đồng bộ 2 chiều và tính tương thích trên cả Desktop và Mobile.

## Requirements
- **Functional**:
  - Gắn trigger đồng bộ trên Top Header và Desktop/Mobile navigation để người dùng có thể mở modal đồng bộ nhanh từ bất cứ màn hình nào.
  - Sau khi Kéo về hoặc Hoàn tác thành công:
    - Bắn thông báo Toast thành công.
    - Cập nhật số dư các ví, danh sách giao dịch, báo cáo thống kê ngay tức thì mà không cần tải lại trang.
- **Non-functional**:
  - Tối ưu giao diện trên Mobile (thao tác chạm, hiển thị modal không bị tràn màn hình).

## Related Code Files
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `js/components/toast.js` (nếu cần mở rộng action)

## Implementation Steps
1. Bổ sung nút "Đồng bộ" nhanh trên Top Header hoặc Sidebar nếu chưa có.
2. Lắng nghe sự kiện click mở `SyncModal`.
3. Kiểm tra toàn bộ kịch bản sử dụng:
   - Kịch bản A: Máy A thêm dữ liệu -> Đẩy lên Google Sheets.
   - Kịch bản B: Máy B mở web -> Kéo về từ Google Sheets -> Xem Dashboard, Ví, Báo cáo có đầy đủ dữ liệu từ Máy A không.
   - Kịch bản C: Thử nghiệm nút Hoàn tác sau khi Kéo về.

## Success Criteria
- [ ] Tất cả các nút Đồng bộ trên giao diện đều mở ra modal lựa chọn 2 chiều.
- [ ] Dữ liệu sau khi Kéo về hiển thị mượt mà trên tất cả các tab (Dashboard, Giao dịch, Ví, Vay/Nợ, Ngân sách, Báo cáo).
- [ ] Responsive hoàn hảo trên cả Desktop và Mobile.

## Risk Assessment
- **Lỗi giao diện biểu đồ khi nạp dữ liệu mới**: Đảm bảo `Analytics` và `Dashboard` lắng nghe event `data:imported` để destroy và render lại Chart.js mà không bị lỗi canvas.
