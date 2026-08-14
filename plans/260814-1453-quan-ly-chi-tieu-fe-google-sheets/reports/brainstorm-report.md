# Báo cáo Brainstorming: Ứng dụng Quản Lý Chi Tiêu (Pure Frontend + Google Sheets Sync)

## 1. Tổng Quan & Mục Tiêu (Problem Statement & Goals)
- **Mục tiêu**: Xây dựng ứng dụng web Quản lý Chi tiêu cá nhân thuần Frontend (Client-side only) để triển khai miễn phí trên GitHub Pages, Vercel hoặc Cloudflare Pages.
- **Tiêu chí cốt lõi**:
  - Không phụ thuộc backend riêng, chi phí vận hành 0đ.
  - Bảo mật dữ liệu tuyệt đối (dữ liệu thuộc 100% quyền sở hữu của người dùng).
  - Hoạt động mượt mà Offline-first, tự động đồng bộ hóa đám mây cá nhân qua Google Sheets API.
  - Trải nghiệm giao diện hiện đại, responsive hoàn hảo trên cả Desktop và Mobile.

---

## 2. Các Phương Án Đã Đánh Giá (Evaluated Approaches)

| Phương Án | Ưu Điểm | Nhược Điểm | Đánh Giá |
| :--- | :--- | :--- | :--- |
| **A. Thuần LocalStorage / IndexedDB** | Cực đơn giản, không cần API/OAuth, tốc độ 0ms | Không tự đồng bộ đa thiết bị, nguy cơ mất dữ liệu nếu xóa cache trình duyệt | Chưa tối ưu trải nghiệm |
| **B. Local-First + Google Sheets API v4 (Được chọn)** | Hoạt động offline mượt mà; Tự động đồng bộ lên Google Sheet cá nhân; User có thể xem/sửa data trực tiếp trên Google Sheets; Miễn phí và bảo mật tuyệt đối | Cần cấu hình Google OAuth Client ID một lần ban đầu | **Tối ưu nhất** |
| **C. Local + Supabase / Firebase Free-tier** | Tự động đồng bộ thời gian thực | Phụ thuộc vào giới hạn free tier của bên thứ ba, dữ liệu không thể mở trực tiếp dạng bảng tính quen thuộc | Không tự do bằng Google Sheets |

---

## 3. Kiến Trúc Kỹ Thuật (Architecture Specification)

### 3.1. Tech Stack
- **Cốt lõi**: HTML5 Semantic + Modern Vanilla CSS3 (CSS Variables, Flexbox/Grid, Dark/Light mode) + Vanilla JavaScript (ES Modules, Không cần build tool).
- **Thư viện bên thứ ba (CDN)**:
  - `Chart.js` (v4): Biểu đồ Doughnut (cơ cấu danh mục), Bar/Line (xu hướng thu chi 6 tháng).
  - `Lucide Icons`: Bộ icon giao diện hiện đại, trực quan.
  - `Google Identity Services (GIS)` + `Google Sheets API v4`: Xác thực OAuth 2.0 Client-side và đọc/ghi dữ liệu spreadsheet.
- **Storage Engine**: `IndexedDB` / `localStorage` đóng vai trò Local Cache & Offline Engine.

### 3.2. Cấu Trúc Bảng Tính Google Sheets (`QuanLyChiTieu_DB`)
1. **`Transactions`**: `id`, `date`, `type` (expense/income/transfer), `amount`, `categoryId`, `walletId`, `toWalletId`, `note`, `createdAt`, `updatedAt`.
2. **`Wallets`**: `id`, `name`, `type`, `initialBalance`, `currentBalance`, `icon`, `color`.
3. **`Categories`**: `id`, `name`, `type` (expense/income), `icon`, `color`, `isDefault`.
4. **`Budgets`**: `id`, `categoryId`, `month` (YYYY-MM), `limitAmount`.
5. **`Settings`**: `currency`, `theme`, `lastSyncTime`, `syncInterval`.

### 3.3. Cấu Trúc Module Dự Án
```text
QuanLyChiTieu/
├── index.html                   # Entry page, Single Page layout
├── css/
│   ├── variables.css            # Theme tokens, colors, typography
│   ├── base.css                 # Base styles, reset, utility classes
│   ├── components.css           # Modal, buttons, cards, charts, progress bars
│   └── layouts.css              # Desktop sidebar & Mobile bottom navigation
├── js/
│   ├── app.js                   # Application bootstrap & router
│   ├── config.js                # Initial categories, default wallets, constants
│   ├── state.js                 # Central reactive state manager & pub-sub
│   ├── services/
│   │   ├── storage.js           # IndexedDB / localStorage data persistence
│   │   ├── google-auth.js       # GIS OAuth2 authentication flow
│   │   ├── google-sheets.js     # Google Sheets API v4 integration
│   │   └── export-import.js     # JSON/CSV backup & restore
│   ├── components/
│   │   ├── dashboard.js         # Stat cards & Chart.js integration
│   │   ├── transaction-modal.js # Add/Edit transaction & transfer modal
│   │   ├── transaction-list.js  # Transaction history with filtering & search
│   │   ├── wallets.js           # Wallet management & balance tracking
│   │   ├── budgets.js           # Budget limits & progress bars with warnings
│   │   └── settings.js          # Google Sync settings, theme switcher, categories
│   └── utils/
│       ├── formatters.js        # Currency (VNĐ), date formatting (DD/MM/YYYY)
│       └── helpers.js           # Helpers (UUID, debounce, calculations)
└── assets/
    └── icons/                   # Static assets & icons
```

---

## 4. Các Tính Năng Cốt Lõi (Core Features)

1. **Dashboard & Thống Kê Tổng Quan**:
   - Thẻ hiển thị: Tổng số dư hiện có, Tổng Thu tháng, Tổng Chi tháng, Dòng tiền tiết kiệm.
   - Biểu đồ Doughnut tỷ trọng chi tiêu theo danh mục.
   - Biểu đồ cột/đường xu hướng thu chi các tháng.
   - Danh sách các giao dịch phát sinh gần nhất.
2. **Quản Lý Giao Dịch (Transactions)**:
   - Thêm/Sửa/Xóa giao dịch Thu / Chi / Chuyển khoản giữa các ví.
   - Bộ lọc đa chiều: theo khoảng thời gian (Hôm nay, Tuần này, Tháng này, Tùy chỉnh), theo Ví, theo Danh mục, tìm kiếm theo ghi chú.
3. **Quản Lý Ví & Tài Khoản (Wallets)**:
   - Các loại ví: Tiền mặt, Tài khoản ngân hàng, Thẻ tín dụng, Tiết kiệm.
   - Tính toán biến động số dư tự động khi phát sinh giao dịch hoặc chuyển khoản nội bộ.
4. **Hạn Mức Chi Tiêu & Ngân Sách (Budgets)**:
   - Thiết lập hạn mức chi tiêu theo danh mục cho từng tháng.
   - Thanh tiến độ cảnh báo màu sắc: Xanh (<70%), Vàng (70-90%), Đỏ (>90% hoặc vượt hạn mức).
5. **Đồng Bộ Google Sheets & Quản Trị Dữ Liệu**:
   - Đăng nhập Google một chạm qua Google Identity Services.
   - Tự động tạo và đồng bộ 2 chiều với Google Sheets.
   - Nút Sync thủ công kèm hiển thị trạng thái kết nối mạng & đồng bộ.
   - Tính năng Export / Import file JSON dự phòng độc lập.
6. **UX & Responsive**:
   - Desktop: Dashboard rộng rãi với Sidebar điều hướng.
   - Mobile: Trải nghiệm chuẩn App với Bottom Navigation Bar và Floating Action Button (FAB) `+` để thêm nhanh giao dịch mọi lúc.
   - Hỗ trợ Chế độ Sáng / Tối (Light / Dark mode).

---

## 5. Kế Hoạch & Các Bước Tiếp Theo (Next Steps)
- Chuyển sang giai đoạn lập kế hoạch chi tiết (`/fis:plan`) để phân rã các giai đoạn triển khai (Setup base, Storage & State, UI Components, Google Sheets Sync, Charts & Analytics, Testing & Polishing).
