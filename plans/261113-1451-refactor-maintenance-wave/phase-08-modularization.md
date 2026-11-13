---
phase: 8
title: "Tách module < 200 dòng"
status: deferred
priority: P3
effort: "2d"
dependencies: [3, 5, 6, 7]
---

# Phase 08: Tách module < 200 dòng

## Overview
Đưa mọi file JS về < 200 dòng theo `docs/code-standards.md`, gom code trùng lặp, gỡ biến global `window.*`. Không đổi hành vi.

## Requirements
- Đo lại sau phase 02-07 (số dòng sẽ khác audit). Mục tiêu dự kiến:
  - `settings.js` (716) → `settings/` gồm `settings-view.js` (khung), `settings-cloud.js` (Firebase), `settings-categories.js`, `settings-data.js` (export/import/danger zone), `settings-appearance.js`.
  - `debts.js` (597) → `debts-view.js`, `debt-form-modal.js`, `debt-repay-modal.js`, `debt-history.js`.
  - `transaction-modal.js` (485) → `transaction-modal.js` (form), phần nợ nhanh tách riêng.
  - `state.js` (476) → `state.js` (store + notify) + `state/` actions theo entity (`transaction-actions.js`, `wallet-actions.js`, `debt-actions.js`, `category-budget-actions.js`), nhận store làm tham số.
  - `transaction-list.js`, `wallets.js`, `dashboard.js`, `analytics.js`, `budgets.js`, `app.js`, `firebase-sync.js`: tách nếu còn > 200.
- Code dùng chung (trùng lặp audit mục 7.4):
  - `js/utils/modal-controller.js`: mở/đóng, backdrop, Escape, focus đầu vào (gộp với `modal-a11y.js`).
  - `js/utils/currency-input.js`: định dạng ô nhập tiền (5 chỗ).
  - `js/utils/wallet-options.js`: render `<option>` ví (debts + transaction-modal).
  - Theme: một hàm duy nhất `setTheme` (trùng `app.js:79-106` và `settings.js:529-541`).
- Gỡ global: `window.appInstance`, `window.transactionModal`, `window.syncModal` (đã bỏ ở phase 02), `window.setAppTheme/getAppTheme`, `window.showToast` → truyền qua import hoặc tham số constructor.
- Màu cứng trong JS template (audit 10.2) → class CSS dùng token `variables.css`; bỏ rule CSS thừa (`layouts.css:82-85`, `.chip-sm`/`.btn-icon-sm` gộp modifier).
- CSS: tách `css/components.css` (514) thành `css/components/*.css` chỉ nếu không làm tăng số request đáng kể; nếu giữ nguyên, ghi ngoại lệ trong code-standards.

## Architecture
Tách theo ranh giới hiện có (`components/`, `services/`, `utils/`, `domain/`). Mỗi lần tách 1 file lớn = 1 commit riêng, smoke test sau từng commit.

## Related Code Files
- Modify/Create: theo danh sách trên; `sw.js` (cập nhật toàn bộ danh sách + bump cache — `tests/sw-assets.test.mjs` bắt thiếu sót); `index.html` nếu đổi CSS.

## Implementation Steps
1. Đo số dòng hiện tại, chốt danh sách cần tách.
2. Tạo utils dùng chung (modal, currency input, wallet options, theme) và thay các chỗ trùng.
3. Tách từng file lớn, mỗi file 1 vòng agy + review + smoke test.
4. Gỡ `window.*`.
5. Dọn màu cứng + CSS thừa.

## Success Criteria
- [ ] Không file `js/**/*.js` nào > 200 dòng (`Get-ChildItem js -Recurse -Filter *.js | % { (Get-Content $_).Count }`).
- [ ] `grep -rn "window\.\(appInstance\|transactionModal\|syncModal\|setAppTheme\|getAppTheme\|showToast\)" js` rỗng.
- [ ] `node --test "tests/*.test.mjs"` xanh; smoke test đầy đủ pass.

## Risk Assessment
- Rủi ro regression cao nhất (event binding DOM, không có test UI). Giảm thiểu: commit nhỏ, smoke test từng commit, không đổi markup/ID trừ khi cần.
- Signal kế hoạch sai: một file sau khi tách vẫn > 200 dòng vì là template HTML dài → cho phép tách template ra hàm render riêng; nếu vẫn không được, ghi ngoại lệ thay vì tách gượng ép.

## Quyết định (2026-11-14)
Chủ dự án chọn gộp việc tách module vào đợt làm lại giao diện (bố cục + UX): component cũ sắp bị thay nên không tách riêng.
