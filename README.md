# Sổ Thu Chi - Quản Lý Chi Tiêu Cá Nhân (Pure Frontend + Google Sheets Sync)

Ứng dụng web quản lý tài chính & chi tiêu cá nhân hiện đại, hoạt động theo mô hình **Local-First** (lưu trữ trực tiếp trên trình duyệt, không gián đoạn khi mất mạng) và tự động đồng bộ hóa đám mây cá nhân với **Google Sheets**.

---

## 🌟 Tính Năng Nổi Bật

1. **Dashboard & Thống Kê Tổng Quan**:
   - Theo dõi nhanh Tổng số dư tài sản, Tổng Thu trong tháng, Tổng Chi trong tháng và Tiết kiệm ròng.
   - Thống kê cơ cấu các hạng mục chi tiêu nhiều nhất.
   - Danh sách giao dịch phát sinh gần đây.

2. **Quản Lý Giao Dịch Đa Năng**:
   - Ghi chép nhanh: **Chi Tiêu**, **Thu Nhập** và **Chuyển Tiền** giữa các ví.
   - Nhập liệu thông minh: Tự động format tiền tệ VNĐ, gợi ý phím tắt nhanh (+50k, +100k, +500k, +1Tr).
   - Bộ lọc mạnh mẽ: Theo khoảng thời gian (Hôm nay, Tuần này, Tháng này, Năm nay), theo Ví, theo Hạng mục và tìm kiếm từ khóa ghi chú.

3. **Sổ Ví & Quản Lý Đa Tài Khoản**:
   - Hỗ trợ nhiều loại ví: Tiền mặt, Tài khoản Ngân hàng, Thẻ tín dụng, Sổ tiết kiệm.
   - Tự động cập nhật số dư khi có giao dịch hoặc chuyển khoản nội bộ.

4. **Hạn Mức Chi Tiêu & Ngân Sách (Budgeting)**:
   - Đặt ngân sách chi tiêu cho từng danh mục theo tháng.
   - Thanh tiến độ động với 3 mức cảnh báo màu sắc trực quan (Xanh lá < 70%, Vàng 70-90%, Đỏ > 90% hoặc vượt hạn mức).

5. **Báo Cáo & Biểu Đồ Trực Quan (Chart.js)**:
   - Biểu đồ tròn (Doughnut Chart) phân tích tỷ trọng các nhóm chi tiêu.
   - Biểu đồ cột kép so sánh xu hướng Thu vs Chi 6 tháng gần nhất.
   - Bảng phân tích chi tiết từng hạng mục chi.

6. **Đồng Bộ Google Sheets & Sao Lưu Độc Lập**:
   - Đăng nhập một chạm qua **Google Identity Services (GIS)** OAuth 2.0.
   - Tự động tạo và đồng bộ 2 chiều vào file Google Spreadsheet `QuanLyChiTieu_DB` trên Google Drive cá nhân của bạn.
   - Xuất dữ liệu ra file `.JSON` và `.CSV` (Excel).
   - Khôi phục dữ liệu từ file sao lưu bất cứ lúc nào.

7. **Trải Nghiệm & Giao Diện Cao Cấp**:
   - **Responsive hoàn hảo**: Sidebar tiện lợi trên Desktop, Bottom Navigation Bar và nút nổi FAB `+` tối ưu thao tác 1 tay trên Mobile.
   - **Dark / Light Mode**: Tự động theo hệ điều hành hoặc chuyển đổi thủ công.
   - **PWA Ready**: Có thể cài đặt (Add to Home Screen) trên iPhone và Android như app native.

---

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local)

Vì đây là ứng dụng thuần Frontend (không cần Node.js, không cần `npm install` hay `npm run build`):
1. Mở trực tiếp file `index.html` bằng trình duyệt web bất kỳ (Chrome, Safari, Edge, Firefox).
2. Hoặc sử dụng extension **Live Server** trong VS Code để trải nghiệm tốt nhất.

---

## ☁️ Hướng Dẫn Cấu Hình Google OAuth Client ID (2 Phút)

Để sử dụng tính năng đồng bộ đám mây cá nhân với Google Sheets:

1. Truy cập vào [Google Cloud Console](https://console.cloud.google.com/) và tạo một Project mới (Ví dụ: `QuanLyChiTieu`).
2. Vào menu **APIs & Services** > **Library** > Tìm và kích hoạt (**Enable**) 2 API:
   - **Google Sheets API**
   - **Google Drive API**
3. Vào **OAuth consent screen** > Chọn **External** > Điền tên ứng dụng (Ví dụ: `Sổ Thu Chi`) và email của bạn > Lưu lại.
4. Vào **Credentials** > Bấm **Create Credentials** > Chọn **OAuth client ID**:
   - Application type: Chọn **Web application**.
   - Mục **Authorized JavaScript origins**: Thêm URL web của bạn (Ví dụ: `http://localhost:5500` hoặc `https://username.github.io`).
5. Bấm **Create**, sau đó copy chuỗi **Client ID** (dạng `xxxx.apps.googleusercontent.com`).
6. Mở trang web Sổ Thu Chi > Vào tab **Cài đặt & Đồng bộ** > Dán Client ID vào và bấm **Lưu**!

---

## 🌐 Hướng Dẫn Triển Khai Lên GitHub Pages Miễn Phí

1. Đẩy (Push) toàn bộ thư mục này lên GitHub repository của bạn.
2. Trên giao diện GitHub, vào tab **Settings** của repository.
3. Chọn mục **Pages** ở menu bên trái.
4. Tại phần **Build and deployment** > **Source**: Chọn `Deploy from a branch` > Branch: `main` / `master` > Folder: `/(root)` > Bấm **Save**.
5. Sau 1 phút, trang web của bạn sẽ được kích hoạt tại địa chỉ: `https://<your-username>.github.io/<repo-name>/`.
