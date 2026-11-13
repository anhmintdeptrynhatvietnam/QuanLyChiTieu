---
phase: 1
title: "Test harness + tách domain thuần"
status: completed
priority: P1
effort: "0.5d"
dependencies: []
---

# Phase 01: Test harness + tách domain thuần

## Overview
Tạo lưới an toàn `node --test` và tách logic tiền ra module thuần (không DOM, không localStorage, không import CDN) để test được trong Node mà không đổi hành vi.

## Requirements
- Functional: hành vi app giữ nguyên 100% (refactor thuần, kể cả các bug hiện có — test ghi lại hành vi hiện tại, bug sửa ở phase 03).
- Non-functional: không package.json, không dependency; chạy được với Node ≥ 18 (máy dev đang dùng v24.18.0).

## Architecture
- `state.js` import `firebase-*.js` → import URL `https://www.gstatic.com/...` → Node không import được `state.js`. Vì vậy test nhắm vào module thuần:
  - `js/domain/ledger.js`: `computeWalletBalances(wallets, transactions, debts) → { [walletId]: number }` (chuyển nguyên logic `state.js:358-400`).
  - `js/domain/debt-rules.js`: `applyRepayment(debt, repayment) → { remainingAmount, status }` (logic `state.js:328-333`).
- `state.js` gọi các hàm này; `recalculateWalletBalances()` chỉ còn gán `currentBalance` từ kết quả.
- Test dùng `node:test` + `node:assert/strict`, đuôi `.test.mjs` (repo không có package.json `"type": "module"`, và không tạo thêm). Test import trực tiếp `../js/domain/*.js` — Node 24.18 tự nhận ESM theo cú pháp (đã chạy thử 2026-11-13). Lệnh phải dùng glob có ngoặc kép `node --test "tests/*.test.mjs"`; `node --test tests/` trên Node 24 không quét thư mục và báo fail.

## Related Code Files
- Create: `js/domain/ledger.js`, `js/domain/debt-rules.js`, `tests/ledger.test.mjs`, `tests/debt-rules.test.mjs`, `tests/formatters.test.mjs`
- Modify: `js/state.js` (gọi domain), `sw.js` (thêm 2 file domain vào `ASSETS_TO_CACHE`, bump `CACHE_NAME`), `CLAUDE.md` (ghi lệnh test, bỏ câu "no test runner")
- Kiểm tra trước: `js/utils/formatters.js` có dùng DOM/`window` không — nếu có, chỉ test hàm thuần.

## Implementation Steps
1. Viết test cho hành vi hiện tại của balance: chi, thu, chuyển, ví không tồn tại, cho vay/đi vay, trả nợ vào ví khác ví gốc.
2. Viết test `applyRepayment` ghi lại hành vi hiện tại, gồm case `remainingAmount = 0` → fallback `amount` (comment trong test mô tả hành vi, không ghi mã phase/bug ID).
3. Tách `ledger.js`, `debt-rules.js`; `state.js` dùng lại.
4. Test `formatCurrency`, `parseFormattedNumber`, `formatDate` (`DD/MM/YYYY`), `getMonthYear`.
5. Thêm 2 file domain và `./js/utils/privacy.js` (đang thiếu) vào `sw.js`, bump `CACHE_NAME`.
6. Cập nhật CLAUDE.md mục Running/Commands: `node --test "tests/*.test.mjs"`.

## Success Criteria
- [x] `node --test "tests/*.test.mjs"` xanh.
- [x] `js/domain/*` không import gì ngoài module domain khác.
- [x] Smoke test bước 1, 2 pass (số dư y hệt trước refactor).

## Risk Assessment
- `formatters.js` dùng `Intl` locale `vi-VN` → Node build thiếu full-ICU sẽ ra format khác; signal: test format fail chỉ ở ký tự phân cách → dùng giá trị kỳ vọng sinh từ chính `Intl.NumberFormat` hoặc bỏ test đó.
