---
phase: 8
title: "Tách state.js, gỡ global, dọn CSS"
status: pending
dependencies: [3, 4, 5, 6, 7]
---

# Phase 08: Tách state.js, gỡ global, dọn CSS

## Requirements
- `js/state.js` → store + notify + persistence (< 200 dòng) và `js/state/` actions theo entity (`transaction-actions.js`, `wallet-actions.js`, `debt-actions.js`, `category-budget-actions.js`, `cloud-actions.js`), nhận store làm tham số. API công khai của `stateStore` giữ nguyên (tests `state-store.test.mjs` không đổi).
- `firebase-sync.js` (468) và `sync-diff.js` (383) tách theo trách nhiệm (listener / push / pull; hash-diff / merge / sort), không đổi hành vi, test hiện có vẫn xanh.
- Gỡ mọi `window.*` còn lại; xoá `js/components/` cũ không còn dùng; xoá CSS không còn selector nào dùng.

## Success Criteria
- [ ] Không file `js/**/*.js` > 200 dòng; grep global rỗng; test xanh.
