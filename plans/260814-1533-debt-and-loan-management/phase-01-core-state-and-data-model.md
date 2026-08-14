---
phase: 1
title: "Core State & Data Model cho Vay/Nợ"
status: pending
priority: P1
effort: "30m"
dependencies: []
---

# Phase 01: Core State & Data Model cho Vay/Nợ

## Overview
Định nghĩa mô hình dữ liệu cho các khoản nợ (`debts`), cấu hình storage key và cài đặt các actions trong `StateStore` (`addDebt`, `recordRepayment`, `deleteDebt`, `updateDebt`) kèm hàm tính toán lại số dư ví tự động `recalculateWalletBalances()`.

## Requirements
- **Functional**:
  - Lưu trữ danh sách `debts` trong LocalStorage qua `STORAGE_KEYS.DEBTS = 'qlct_debts'`.
  - Hỗ trợ 2 loại nợ: `lend` (Tôi cho vay / Người khác nợ tôi) và `borrow` (Tôi đi vay / Tôi nợ người khác).
  - Khoản nợ lưu thông tin: `id`, `personName`, `type`, `amount`, `remainingAmount`, `walletId`, `dueDate`, `note`, `status` (`pending` | `partially_paid` | `paid`), `createdAt`, `repayments` (mảng lịch sử trả nợ).
  - Action `recordRepayment(debtId, { amount, walletId, date, note })`: Trừ dần `remainingAmount`, thêm bản ghi trả nợ vào `repayments`, tự động chuyển trạng thái `partially_paid` hoặc `paid`.
  - Cập nhật hàm `recalculateWalletBalances()`:
    - Khi cho vay (`lend`): trừ tiền ví nguồn.
    - Khi thu nợ (`repayment` của `lend`): cộng tiền ví nhận.
    - Khi đi vay (`borrow`): cộng tiền ví nhận.
    - Khi trả nợ (`repayment` của `borrow`): trừ tiền ví nguồn.
- **Non-functional**: Dưới 200 dòng/tệp, tuân thủ KISS/DRY/YAGNI.

## Architecture
```
User Action (Tạo nợ / Trả nợ)
      ↓
StateStore (addDebt / recordRepayment)
      ↓
recalculateWalletBalances() (Cập nhật số dư ví thực tế)
      ↓
Save to LocalStorage ('qlct_debts', 'qlct_wallets') & Notify listeners
```

## Related Code Files
- Modify: `js/config.js`
- Modify: `js/state.js`

## Implementation Steps
1. Mở `js/config.js`, thêm `STORAGE_KEYS.DEBTS = 'qlct_debts'`.
2. Mở `js/state.js`:
   - Khởi tạo `debts: StorageService.get(STORAGE_KEYS.DEBTS, [])`.
   - Cập nhật `saveToStorage()` để lưu `this.state.debts`.
   - Thêm methods `addDebt`, `recordRepayment`, `deleteDebt`, `updateDebt`.
   - Cập nhật hàm `recalculateWalletBalances()` tính toán số dư ví theo các giao dịch nợ và trả nợ.

## Success Criteria
- [ ] LocalStorage lưu trữ được danh sách `debts`.
- [ ] Gọi `addDebt` loại `lend` làm giảm số dư ví nguồn tương ứng.
- [ ] Gọi `recordRepayment` làm tăng số dư ví nhận và giảm `remainingAmount`.
- [ ] Tổng chi tiêu và thu nhập hàng tháng không bị ảnh hưởng.
