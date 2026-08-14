# Phase 06: Đồng Bộ Google Sheets API & Quản Trị Dữ Liệu

## Context Links
- Plan: [plan.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/plan.md)
- Báo cáo Brainstorming: [brainstorm-report.md](file:///C:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1453-quan-ly-chi-tieu-fe-google-sheets/reports/brainstorm-report.md)

## Overview
- **Priority**: High (P0)
- **Current status**: Complete
- **Brief description**: Tích hợp Google Identity Services (GIS) để đăng nhập Google OAuth 2.0 trực tiếp từ trình duyệt, kết nối Google Sheets API v4 để tự động tạo bảng tính `QuanLyChiTieu_DB` và đồng bộ 2 chiều (Local <-> Google Sheets). Đồng thời cung cấp công cụ Xuất/Nhập JSON/CSV dự phòng độc lập.

## Key Insights
- Sử dụng Google Identity Services (GIS) Token Client flow (`google.accounts.oauth2.initTokenClient`) chuẩn bảo mật mới nhất của Google, không cần Secret Key, tương thích 100% với static hosting (GitHub Pages).
- Khi người dùng đăng nhập lần đầu:
  1. Tìm kiếm file `QuanLyChiTieu_DB` trên Google Drive của người dùng (thông qua Drive API/Sheets API).
  2. Nếu chưa có -> Tự động tạo Spreadsheet với 5 sheets chuẩn: `Transactions`, `Wallets`, `Categories`, `Budgets`, `Settings`.
  3. Nếu đã có -> Đọc dữ liệu về hợp nhất với Local State (ưu tiên bản ghi mới hơn theo `updatedAt`).
- Nút Sync thủ công kèm hiển thị trạng thái (Đã đồng bộ, Đang đồng bộ, Lỗi / Offline) ngay trên Header.
- Cung cấp giao diện hướng dẫn từng bước (Step-by-step Modal kèm ảnh minh họa) để người dùng lấy Client ID từ Google Cloud Console trong 2 phút.

## Requirements
- **Functional Requirements**:
  - Đăng nhập / Đăng xuất tài khoản Google.
  - Lưu và quản lý Google Client ID trong cài đặt cá nhân.
  - Tự động tạo spreadsheet và đồng bộ 2 chiều dữ liệu giữa Local và Google Sheets.
  - Xử lý xung đột dữ liệu dựa trên timestamp `updatedAt`.
  - Xuất dữ liệu ra file JSON / CSV để tải về máy.
  - Nhập dữ liệu từ file JSON / CSV đã sao lưu để phục hồi.
- **Non-functional Requirements**:
  - Không chặn luồng UI khi đang gọi Google API (chạy bất đồng bộ).
  - Hiển thị Toast thông báo trạng thái đồng bộ rõ ràng.

## Architecture
- `js/services/google-auth.js`: Khởi tạo GIS Client, yêu cầu Access Token với scope `spreadsheets` và `drive.file`, quản lý phiên đăng nhập.
- `js/services/google-sheets.js`: Các hàm tương tác Sheets API (Tạo sheet, đọc range `A:Z`, ghi/cập nhật batch update).
- `js/services/export-import.js`: Đọc/Ghi file JSON và CSV cục bộ.
- `js/components/settings.js`: Giao diện cài đặt Google Sync, hướng dẫn lấy Client ID, tùy biến danh mục và quản lý dữ liệu.

## Related Code Files
- **Create**:
  - `js/services/google-auth.js`
  - `js/services/google-sheets.js`
  - `js/services/export-import.js`
  - `js/components/settings.js`
- **Modify**:
  - `index.html`
  - `js/state.js`
  - `js/app.js`

## Implementation Steps
1. Xây dựng module `google-auth.js` tích hợp GIS SDK, lưu access token trong memory/session.
2. Xây dựng module `google-sheets.js` với các API methods: `findOrCreateDatabase()`, `pullFromCloud()`, `pushToCloud()`.
3. Xây dựng module `export-import.js` (Export JSON/CSV, Validate & Import JSON).
4. Xây dựng component `settings.js` với form nhập Client ID, nút kết nối Google, nút Sync ngay, nút Export/Import và Modal hướng dẫn tạo Google Client ID chi tiết.
5. Tích hợp thanh trạng thái Sync Badge trên Header ứng dụng.

## Todo List
- [x] Xây dựng Google Identity Services Auth flow (`google-auth.js`)
- [x] Xây dựng Google Sheets API v4 CRUD Engine (`google-sheets.js`)
- [x] Xây dựng Export / Import JSON & CSV (`export-import.js`)
- [x] Xây dựng giao diện Settings & Sync (`settings.js`)
- [x] Xây dựng Modal Hướng dẫn tạo Google Client ID cho người dùng
- [x] Kiểm thử luồng đồng bộ 2 chiều và khôi phục dữ liệu từ Google Sheets

## Success Criteria
- Đăng nhập Google thành công, tự động khởi tạo Google Sheet trên Drive của user.
- Thêm giao dịch trên web -> Dữ liệu xuất hiện tức thì trên Google Sheets.
- Xuất và Nhập lại file JSON khôi phục 100% dữ liệu nguyên vẹn.

## Risk Assessment & Mitigation
- **Rủi ro**: Access Token Google hết hạn sau 1 giờ.
- **Giải pháp**: Xử lý tự động kích hoạt refresh token request ngầm hoặc hiển thị nút "Đăng nhập lại" thân thiện khi token hết hạn.

## Security Considerations
- Client ID được lưu an toàn trong `localStorage` của trình duyệt cá nhân người dùng.
- Không có bất kỳ server trung gian nào can thiệp vào token hoặc dữ liệu của người dùng.

## Next Steps
- Chuyển sang Phase 07: Kiểm Thử, Tối Ưu Hóa & Đóng Gói Triển Khai GitHub Pages.
