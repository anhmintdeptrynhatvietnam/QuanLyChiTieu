# Sổ Thu Chi - Quản Lý Chi Tiêu Cá Nhân (Pure Frontend + Firebase Cloud Sync)

Ứng dụng web quản lý tài chính & chi tiêu cá nhân hiện đại, hoạt động theo mô hình **Local-First** (lưu trữ trực tiếp trên trình duyệt qua `localStorage`, không gián đoạn khi mất mạng) và đồng bộ hóa đám mây realtime qua **Firebase Firestore**.

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
   - Số dư được tính toán tự động bằng cách replay toàn bộ lịch sử giao dịch và các khoản vay/trả nợ ([js/domain/ledger.js](js/domain/ledger.js)).

4. **Sổ Vay & Nợ (Debts)**:
   - Quản lý các khoản Cho vay và Đi vay chi tiết theo từng người.
   - Theo dõi tiến độ trả nợ từng phần hoặc thanh toán toàn bộ.

5. **Hạn Mức Chi Tiêu & Ngân Sách (Budgets)**:
   - Đặt ngân sách chi tiêu cho từng danh mục theo tháng.
   - Thanh tiến độ động với 3 mức cảnh báo màu sắc trực quan (Xanh lá < 70%, Vàng 70-90%, Đỏ > 90% hoặc vượt hạn mức).

6. **Báo Cáo & Biểu Đồ Trực Quan (Chart.js)**:
   - Biểu đồ tròn (Doughnut Chart) phân tích tỷ trọng các nhóm chi tiêu.
   - Biểu đồ cột kép so sánh xu hướng Thu vs Chi 6 tháng gần nhất.
   - Bảng phân tích chi tiết từng hạng mục chi.

7. **Đồng Bộ Cloud (Firebase) & Sao Lưu Độc Lập**:
   - Đồng bộ realtime per-record qua Firebase Firestore.
   - Hỗ trợ đăng nhập bằng tài khoản Google (popup) hoặc dùng thử Khách (Ẩn danh).
   - Xuất dữ liệu dự phòng ra file `.JSON` và `.CSV` (Excel).
   - Khôi phục dữ liệu từ file sao lưu bất cứ lúc nào.

8. **Trải Nghiệm & Giao Diện Cao Cấp (PWA)**:
   - **Responsive hoàn hảo**: Sidebar tiện lợi trên Desktop, Bottom Navigation Bar và nút nổi FAB `+` tối ưu thao tác 1 tay trên Mobile.
   - **Dark / Light Mode**: Tự động theo hệ điều hành hoặc chuyển đổi thủ công.
   - **PWA Ready**: Cài đặt (Add to Home Screen) trên iPhone và Android như app native, hỗ trợ offline.

---

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local)

Vì đây là ứng dụng thuần Frontend viết bằng Vanilla JS ES modules (không cần Node.js, không cần `npm install` hay build step), các trình duyệt web chặn nạp ES module qua giao thức `file://` do chính sách CORS. Bạn cần chạy qua một web server tĩnh:

1. **Sử dụng VS Code Live Server**: Click chuột phải vào `index.html` > chọn **Open with Live Server**.
2. **Hoặc sử dụng Python**: Chạy lệnh sau trong thư mục dự án:
   ```bash
   python -m http.server 5500
   ```
   Sau đó mở trình duyệt tại: `http://localhost:5500`.

---

## ☁️ Đồng Bộ Cloud (Firebase)

Ứng dụng sử dụng **Firebase Firestore** để đồng bộ dữ liệu tức thì giữa các thiết bị với độ trễ thấp (<100ms) theo cơ chế per-record document (`users/{uid}/{collection}/{id}`).

### 1. Tùy Chọn Đăng Nhập
Tại tab **Cài đặt & Đồng bộ**, bạn có 2 hình thức:
- **Đăng Nhập Google**: Đăng nhập nhanh qua cửa sổ popup để đồng bộ vào tài khoản cá nhân.
- **Dùng Thử Ẩn Danh (Guest)**: Trải nghiệm thử đồng bộ mà không cần cung cấp email.

> [!NOTE]
> Để dùng tính năng **Ẩn Danh**, cần kích hoạt phương thức này trong **Firebase Console** → **Authentication** → **Sign-in method** → Bật **Anonymous**. Nếu chưa bật, ứng dụng sẽ hiển thị thông báo lỗi tiếng Việt hướng dẫn thao tác.

### 2. Sử Dụng Cấu Hình Firebase Riêng
Mặc định ứng dụng đã có sẵn cấu hình kết nối tới project mẫu `sothuchi-5f58e` (khai báo trong [js/config.js](js/config.js)). Nếu muốn lưu trữ trên Firebase riêng của bạn:
1. Tạo một Firebase project trên [Firebase Console](https://console.firebase.google.com/).
2. Bật dịch vụ **Authentication** (Google & Anonymous) và **Firestore Database**.
3. Vào tab **Cài đặt & Đồng bộ** > Mở rộng mục **Cấu Hình Firebase Riêng Của Bạn**, điền `Project ID`, `API Key`, `Auth Domain` của bạn và bấm **Lưu Cấu Hình Firebase**.

### 3. Quy Tắc Bảo Mật & Triển Khai `firestore.rules`
Toàn bộ quy tắc bảo mật được định nghĩa trong file [firestore.rules](firestore.rules), quy định mỗi người dùng chỉ có thể đọc và ghi dữ liệu trong cây tài liệu của chính họ (`users/{uid}/**`).

Để triển khai rules:
- **Cách 1 (Firebase Console)**: Vào **Firebase Console** → **Firestore Database** → tab **Rules**, dán nội dung từ [firestore.rules](firestore.rules) và bấm **Publish**.
- **Cách 2 (Firebase CLI)**:
  ```bash
  firebase deploy --only firestore:rules --project sothuchi-5f58e
  ```
  *(Lưu ý: Lệnh này cần file `firebase.json` chứa `{"firestore":{"rules":"firestore.rules"}}` ở thư mục gốc, file này không nằm trong repo).*

---

## 🧪 Chạy Test

Hệ thống unit test được xây dựng hoàn toàn bằng module chuẩn của Node.js (`node:test` và `node:assert/strict`), không cần cài đặt thêm bất kỳ thư viện bên thứ ba nào:

```bash
node --test "tests/*.test.mjs"
```

*(Lưu ý: Bắt buộc đặt đường dẫn glob trong dấu ngoặc kép `"tests/*.test.mjs"` vì Node 24 không tự động tìm kiếm thư mục `tests/` trần. Dự án không dùng lint/typecheck config).*

Các bài test bao phủ toàn bộ logic nghiệp vụ thuần trong thư mục `js/domain/` và kiểm tra tính toàn vẹn của danh sách precache Service Worker ([tests/sw-assets.test.mjs](tests/sw-assets.test.mjs)).

---

## 📱 PWA & Giới Hạn Offline Lần Đầu

Ứng dụng hỗ trợ cài đặt PWA thông qua Service Worker ([sw.js](sw.js)) và [manifest.json](manifest.json).

- **Giới hạn offline lần đầu**: Theo cơ chế hoạt động của trình duyệt, ứng dụng chỉ có thể hoạt động offline sau khi bạn đã truy cập trực tuyến ít nhất một lần để Service Worker tải và lưu cache các tài nguyên tĩnh.
- **Tài nguyên CDN**: Các thư viện CDN bên ngoài được ghim phiên bản cố định (Lucide 1.72.0, Chart.js 4.6.1) và được cache runtime trong `qlct-cdn-v1`.

---

## 🌐 Triển Khai Lên GitHub Pages

1. Đẩy (Push) toàn bộ mã nguồn lên GitHub repository trên nhánh `main`.
2. Trên GitHub, vào **Settings** của repository > mục **Pages**.
3. Tại phần **Build and deployment** > **Source**: Chọn `Deploy from a branch` > Branch: `main` > Folder: `/ (root)` > Bấm **Save**.
4. **Cấp quyền tên miền trong Firebase Console**:
   - Truy cập **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**.
   - Thêm tên miền GitHub Pages của bạn (ví dụ: `<username>.github.io`). Nếu không thêm, Google Sign-in sẽ gặp lỗi `auth/unauthorized-domain`.
5. **Lưu ý sau mỗi lần phát hành (Release)**: Cần tải lại trang (reload) trên mọi thiết bị đang mở để Service Worker cập nhật phiên bản cache mới nhất.
