---
phase: 3
title: "Toàn vẹn sổ tiền"
status: pending
priority: P1
effort: "0.5d"
dependencies: [1]
---

# Phase 03: Toàn vẹn sổ tiền

## Overview
Sửa các lỗi làm lệch số dư/nợ trong `state.js` và form trả nợ, test-first trên module domain từ phase 01.

## Requirements
- BUG-05: `deleteWallet` từ chối nếu ví được tham chiếu bởi `debt.walletId` hoặc `repayment.walletId`; thông báo lý do rõ ràng.
- BUG-09: trả nợ vượt `remainingAmount` bị chặn ở cả state (`recordRepayment` trả `null`/lý do) và UI (`debts.js` form, hiển thị số tối đa).
- ADD-05: không ghi trả nợ cho khoản `paid`; bỏ fallback `Number(remainingAmount) || amount` (dùng `?? amount` chỉ khi field thiếu).
- BUG-10: thêm `deleteBudget(categoryId, month)` + nút xoá trong `budgets.js`.
- ADD-06: `updateTransaction` dùng `Number.isFinite` thay vì `|| old`; amount ≤ 0 bị từ chối (đồng nhất với form thêm mới — kiểm tra form hiện chặn 0 chưa).
- `updateDebt` sửa `amount` → `remainingAmount` tính lại = `amount − tổng repayments` (kiểm tra UI có cho sửa amount không).
- `deleteWallet` gọi `recalculateWalletBalances()` cho nhất quán.

## Architecture
- Đưa luật vào `js/domain/debt-rules.js`: `canRepay(debt, amount)`, `applyRepayment`, `recomputeRemaining(debt)`; `js/domain/ledger.js`: `findWalletReferences(walletId, state) → { transactions, debts }`.
- `state.js` chỉ điều phối + notify.

## Related Code Files
- Modify: `js/domain/ledger.js`, `js/domain/debt-rules.js`, `js/state.js` (243-250, 184-198, 312-356, 403-423), `js/components/debts.js` (form trả nợ ~589), `js/components/budgets.js`, `js/components/wallets.js` (hiển thị lý do không xoá được)
- Modify: `tests/ledger.test.mjs`, `tests/debt-rules.test.mjs` (cập nhật test hành vi cũ → hành vi đúng)

## Implementation Steps
1. Sửa test phase 01 đang ghi hành vi lỗi thành hành vi đúng (red).
2. Thêm test mới cho từng requirement (red).
3. Sửa domain + state (green).
4. Cập nhật UI debts/budgets/wallets.

## Success Criteria
- [ ] `node --test "tests/*.test.mjs"` xanh với test cho: xoá ví có nợ, trả quá số còn lại, trả khoản đã paid, sửa amount nợ, xoá ngân sách, sửa giao dịch amount 0.
- [ ] Smoke test bước 1, 2, 3 pass.

## Risk Assessment
- Dữ liệu cũ đã có repayment vượt số nợ → sau khi chặn, dữ liệu cũ vẫn hiển thị (không tự sửa dữ liệu). Signal: `remainingAmount` âm hoặc tổng repayments > amount trong dữ liệu thật → chỉ hiển thị cảnh báo, không migrate tự động.
