---
title: "Quản Lý Sổ Vay & Nợ (Debts & Loans Management)"
status: completed
created: "2026-08-14"
phases:
  - id: 1
    file: phase-01-core-state-and-data-model.md
    title: "Core State & Data Model cho Vay/Nợ"
    status: completed
  - id: 2
    file: phase-02-debts-management-view.md
    title: "Giao diện Sổ Vay & Nợ (Debts Component)"
    status: completed
  - id: 3
    file: phase-03-transaction-modal-integration.md
    title: "Tích hợp Tab Vay/Nợ trong Modal Ghi chép"
    status: completed
  - id: 4
    file: phase-04-dashboard-sync-and-export.md
    title: "Dashboard Widget, Sao lưu JSON & Google Sheets Sync"
    status: completed
---

# Kế Hoạch: Quản Lý Sổ Vay & Nợ (Debts & Loans Management)

## Tổng Quan
Xây dựng phân hệ Quản lý Sổ Vay & Nợ 2 chiều (*Cho vay* & *Đi vay*), hỗ trợ trả nợ linh hoạt từng phần hoặc toàn bộ. Dòng tiền tác động trực tiếp đến số dư các ví liên quan nhưng **tuyệt đối không bị tính vào Thu nhập hay Chi tiêu sinh hoạt tháng**.

## Danh Sách Các Giai Đoạn (Phases)

| Giai đoạn | Tên Giai Đoạn | Trạng thái | Ưu tiên |
|:---|:---|:---:|:---:|
| [Phase 01](file:///c:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1533-debt-and-loan-management/phase-01-core-state-and-data-model.md) | Core State & Data Model cho Vay/Nợ | ✅ Completed | P1 |
| [Phase 02](file:///c:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1533-debt-and-loan-management/phase-02-debts-management-view.md) | Giao diện Sổ Vay & Nợ (Debts Component) | ✅ Completed | P1 |
| [Phase 03](file:///c:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1533-debt-and-loan-management/phase-03-transaction-modal-integration.md) | Tích hợp Tab Vay/Nợ trong Modal Ghi chép | ✅ Completed | P2 |
| [Phase 04](file:///c:/Users/anhpqd2/Desktop/Tool/QuanLyChiTieu/plans/260814-1533-debt-and-loan-management/phase-04-dashboard-sync-and-export.md) | Dashboard Widget, Sao lưu JSON & Google Sheets Sync | ✅ Completed | P2 |

## Ràng Buộc & Nguyên Tắc Cốt Lõi
1. **Quy tắc Kế toán Dòng tiền**:
   - `Cho vay` (`lend`): Tiền ra khỏi ví nguồn -> Trừ số dư ví -> **Không tính vào Chi tiêu tháng**.
   - `Thu nợ` (`collect`): Tiền vào ví nhận -> Cộng số dư ví -> **Không tính vào Thu nhập tháng**.
   - `Đi vay` (`borrow`): Tiền vào ví nhận -> Cộng số dư ví -> **Không tính vào Thu nhập tháng**.
   - `Trả nợ` (`repay`): Tiền ra khỏi ví nguồn -> Trừ số dư ví -> **Không tính vào Chi tiêu tháng**.
2. **Theo dõi đa kỳ**: Cho phép trả nợ nhiều lần cho 1 khoản vay/nợ.
