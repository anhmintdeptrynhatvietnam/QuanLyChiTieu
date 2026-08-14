# System Architecture: Ứng Dụng Quản Lý Chi Tiêu (Pure Frontend)

## 1. Tổng Quan Kiến Trúc
Hệ thống là một **Single Page Application (SPA)** thuần Client-Side, xây dựng bằng **HTML5, Modern CSS3 và Vanilla JavaScript (ES Modules)**, không phụ thuộc vào framework nặng hay build step phức tạp. Ứng dụng chạy theo mô hình **Local-First**, lưu trữ dữ liệu tại trình duyệt và đồng bộ hóa đám mây cá nhân với **Google Sheets API v4**.

```
+-------------------------------------------------------------------------+
|                              Browser (Client)                           |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                     Giao Diện Người Dùng (UI)                     |  |
|  |  - Dashboard: Thẻ thống kê + Biểu đồ Chart.js (Doughnut & Bar)   |  |
|  |  - Transactions: Modal Thu/Chi/Chuyển + Danh sách & Bộ lọc       |  |
|  |  - Wallets: Quản lý đa ví & Chuyển tiền nội bộ                    |  |
|  |  - Budgets: Đặt hạn mức chi tiêu theo tháng & Thanh tiến độ       |  |
|  |  - Settings: Google Sync, Đổi theme Sáng/Tối, Export/Import JSON  |  |
|  +-------------------------------------------------------------------+  |
|                                   |                                     |
|  +-------------------------------------------------------------------+  |
|  |                Central Reactive Store (state.js)                  |  |
|  |  - Quản lý trạng thái tập trung (Pub/Sub pattern)                 |  |
|  |  - Xử lý nghiệp vụ: Tính số dư ví, tính ngân sách, format tiền   |  |
|  +-------------------------------------------------------------------+  |
|                         /                           \                   |
|                        /                             \                  |
|  +-----------------------------+         +---------------------------+  |
|  |   Storage Engine (Local)    |         |    Google Sync Service    |  |
|  |   - IndexedDB / localStorage|         |    - GIS OAuth2 Client    |  |
|  |   - Phản hồi tức thì 0ms    |         |    - Google Sheets API v4 |  |
|  +-----------------------------+         +---------------------------+  |
+-------------------------------------------------------------------------+
                                                         | (OAuth2 HTTPS)
                                                         v
                                           +---------------------------+
                                           | Google Sheets Spreadsheet |
                                           | ("QuanLyChiTieu_DB")      |
                                           | Trên Google Drive Cá Nhân |
                                           +---------------------------+
```

## 2. Các Tầng Thành Phần (Layers)

### 2.1. Presentation Layer (Giao diện)
- Semantic HTML5, CSS Grid & Flexbox.
- Design tokens qua CSS Custom Properties hỗ trợ Dark / Light mode tức thì.
- Thư viện hiển thị biểu đồ: `Chart.js` qua CDN.
- Thư viện biểu tượng: `Lucide Icons` qua CDN.

### 2.2. State & Business Logic Layer
- `state.js`: Kho lưu trữ trạng thái đơn nhất (Single Source of Truth) kết hợp cơ chế Pub/Sub. Khi trạng thái thay đổi, các UI component đã đăng ký sẽ tự động re-render tương ứng.
- Logic kiểm soát số dư ví, tự động tính toán tổng thu, tổng chi, phần trăm hoàn thành ngân sách.

### 2.3. Data Persistence & Sync Layer
- **Local Persistence**: Lưu trữ offline trong `localStorage` / `IndexedDB`, đảm bảo ứng dụng luôn sẵn sàng sử dụng kể cả khi không có kết nối internet.
- **Cloud Synchronization**: Sử dụng Google Identity Services (GIS) để xin quyền truy cập Google Drive/Sheets của chính người dùng. Dữ liệu được đồng bộ 2 chiều vào file spreadsheet `QuanLyChiTieu_DB`.
