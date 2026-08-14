---
title: "Đồng Bộ 2 Chiều Google Sheets (Push / Pull & Safe Snapshot)"
status: completed
created: "2026-08-15"
phases:
  - id: 1
    file: phase-01-service-sync-engine.md
    title: "Nâng cấp GoogleSheetsService (Push, Pull, Safe Snapshot, Undo Restore)"
    status: completed
  - id: 2
    file: phase-02-sync-modal-and-settings-ui.md
    title: "Giao diện Modal Lựa Chọn Đồng Bộ & Tích hợp Tab Cài Đặt"
    status: completed
  - id: 3
    file: phase-03-global-integration-and-verification.md
    title: "Kết nối Nút Đồng Bộ Toàn Cục & Kiểm Thử Toàn Diện"
    status: completed
---

# Kế Hoạch: Đồng Bộ 2 Chiều Google Sheets (Push / Pull & Safe Snapshot)

## Tổng Quan
Xây dựng tính năng đồng bộ 2 lựa chọn độc lập cho Google Sheets: **Đẩy lên (Push/Backup)** và **Kéo về (Pull/Restore)**. Hệ thống hoạt động theo cơ chế Ghi đè có kiểm soát (Controlled Overwrite), tích hợp tự động lưu bản sao lưu an toàn (**Safe Snapshot**) trước khi nạp dữ liệu đám mây vào máy để phòng tránh mất mát dữ liệu khi thao tác nhầm.

## Danh Sách Các Giai Đoạn (Phases)

| Giai đoạn | Tên Giai Đoạn | Trạng thái | Ưu tiên |
|:---|:---|:---:|:---:|
| [Phase 01](file:///c:/Users/anhmi/OneDrive/Desktop/Tool/QuanLyThuChi/plans/260815-0006-two-way-google-sheets-sync/phase-01-service-sync-engine.md) | Nâng cấp GoogleSheetsService (Push, Pull, Safe Snapshot, Undo Restore) | ✅ Completed | P1 |
| [Phase 02](file:///c:/Users/anhmi/OneDrive/Desktop/Tool/QuanLyThuChi/plans/260815-0006-two-way-google-sheets-sync/phase-02-sync-modal-and-settings-ui.md) | Giao diện Modal Lựa Chọn Đồng Bộ & Tích hợp Tab Cài Đặt | ✅ Completed | P1 |
| [Phase 03](file:///c:/Users/anhmi/OneDrive/Desktop/Tool/QuanLyThuChi/plans/260815-0006-two-way-google-sheets-sync/phase-03-global-integration-and-verification.md) | Kết nối Nút Đồng Bộ Toàn Cục & Kiểm Thử Toàn Diện | ✅ Completed | P2 |

## Nguyên Tắc Cốt Lõi
1. **Minh bạch 2 chiều**: Tách biệt rõ ràng hành động Đẩy lên (Local -> Cloud) và Kéo về (Cloud -> Local), không tự động merge ngầm gây sai lệch số dư ví.
2. **Safe Snapshot**: Tự động lưu 1 bản snapshot vào LocalStorage trước khi ghi đè từ Cloud về. Hỗ trợ nút Hoàn tác (Undo) tức thì.
3. **Cập nhật Reactive**: Sau khi kéo dữ liệu về máy, tự động tính toán lại số dư ví (`recalculateWalletBalances`) và thông báo cập nhật toàn bộ view (Dashboard, Wallets, Transactions, Debts, Budgets).
