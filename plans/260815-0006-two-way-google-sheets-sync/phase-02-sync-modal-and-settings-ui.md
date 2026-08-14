---
phase: 2
title: "Giao diện Modal Lựa Chọn Đồng Bộ & Tích hợp Tab Cài Đặt"
status: completed
priority: P1
effort: "1.5h"
dependencies: [1]
---

# Phase 02: Giao diện Modal Lựa Chọn Đồng Bộ & Tích hợp Tab Cài Đặt

## Overview
Xây dựng giao diện Modal Lựa Chọn Đồng Bộ trực quan với 2 lựa chọn **Đẩy lên (Push)** và **Kéo về (Pull)**, tích hợp cảnh báo xác nhận an toàn khi kéo về và thanh thông báo / nút bấm Hoàn tác trong tab Cài Đặt.

## Requirements
- **Functional**:
  - Tạo Modal Đồng Bộ (`SyncModal` hoặc tích hợp trong Settings) bao gồm:
    - **Thẻ lựa chọn 1: 📤 Đẩy lên Google Sheets (Push)**
      - Tóm tắt dữ liệu hiện có: Số giao dịch, số ví, số danh mục.
      - Nút bấm "Bắt đầu Đẩy lên".
    - **Thẻ lựa chọn 2: 📥 Kéo về từ Google Sheets (Pull)**
      - Mô tả: "Đọc dữ liệu từ Google Sheets và thay thế dữ liệu trên máy".
      - Nút bấm "Bắt đầu Kéo về".
  - **Hộp thoại xác nhận an toàn (Safety Confirm Dialog)**:
    - Khi bấm "Kéo về", hiển thị popup: *"⚠️ Lưu ý: Thao tác này sẽ ghi đè dữ liệu trên thiết bị bằng dữ liệu từ Google Sheets. Hệ thống sẽ tự động tạo một bản sao lưu dự phòng để bạn có thể hoàn tác nếu cần. Bạn có chắc chắn muốn tiếp tục?"*
  - **Banner Hoàn tác (Undo Banner)**:
    - Trong tab Cài Đặt, nếu có `hasPrePullBackup() === true`, hiển thị thông báo: *"Dữ liệu vừa được kéo từ Google Sheets. Bạn có thể hoàn tác lại bản trước đó nếu thao tác nhầm: [Nút Hoàn tác ngay]"*.
- **Non-functional**:
  - Giao diện thiết kế theo chuẩn Design Tokens hiện có (Inter font, thẻ Card, Badges, Lucide icons, Dark/Light mode).

## Related Code Files
- Modify: `js/components/settings.js`
- Create / Modify: `js/components/sync-modal.js` (hoặc modal DOM trong `index.html`)

## Implementation Steps
1. Xây dựng cấu trúc HTML & CSS cho Modal Lựa chọn Đồng bộ (2 action card đẹp mắt, icon lớn, hiển thị trạng thái kết nối).
2. Tích hợp sự kiện cho nút "Đẩy lên" -> Gọi `GoogleSheetsService.push()`.
3. Tích hợp sự kiện cho nút "Kéo về" -> Hiện Confirm -> Gọi `GoogleSheetsService.pull()`.
4. Render Banner Hoàn tác (Undo) và xử lý sự kiện nút "Hoàn tác" -> Gọi `GoogleSheetsService.restorePrePullBackup()`.

## Success Criteria
- [ ] Bấm nút Đồng bộ mở ra Modal 2 lựa chọn rõ ràng.
- [ ] Bấm "Đẩy lên" thực hiện sao lưu thành công.
- [ ] Bấm "Kéo về" xuất hiện cảnh báo, sau khi đồng ý thì nạp dữ liệu và hiện banner hoàn tác.
- [ ] Bấm nút "Hoàn tác" khôi phục lại dữ liệu cũ thành công.

## Risk Assessment
- **Người dùng đóng modal khi đang đồng bộ**: Hiển thị spinner loading và vô hiệu hóa nút bấm trong quá trình đang gửi request.
