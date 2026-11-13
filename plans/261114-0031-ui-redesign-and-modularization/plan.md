---
title: "Làm lại giao diện (bố cục + UX) + tách module"
status: in-progress
branch: feat/ui-redesign
created: 2026-11-14
---

# Plan: Làm lại giao diện + tách module

## Mục tiêu
App ghi chép chi tiêu dùng hằng ngày trên điện thoại: ghi một khoản chi trong ~3 chạm, xem nhanh tình hình tháng, giao diện sáng/tối theo hệ thống. Đồng thời đưa mọi file JS < 200 dòng (thay Phase 08 của plan `261113-1451-refactor-maintenance-wave`).

## Quyết định của chủ dự án (2026-11-14)
- Bố cục theo đề xuất: nav 5 mục (Tổng quan · Giao dịch · [+] · Báo cáo · Thêm), ghi giao dịch dạng bottom sheet + lưới hạng mục, Tổng quan 1 thẻ lớn, giao dịch nhóm theo ngày.
- Theme mặc định theo hệ thống, có nút đổi tay (Sáng / Tối / Theo hệ thống).
- Release MỘT lần khi xong toàn bộ (nhánh `feat/ui-redesign`, merge `main` ở phase 09).

## Non-goals
- Không đổi dữ liệu, schema Firestore, sync engine, domain logic (`js/domain/*`, `js/services/*` giữ nguyên hành vi).
- Không thêm framework/build/npm. Không thêm tính năng nghiệp vụ mới ngoài UX đã nêu.

## Phases
| # | Phase | Status | Phụ thuộc | Thực thi |
|---|---|---|---|---|
| 01 | [Design system + khối UI dùng chung](phase-01-design-system-and-ui-primitives.md) | completed | — | agy medium |
| 02 | [Khung app + điều hướng mới](phase-02-app-shell-and-navigation.md) | completed | 01 | agy medium |
| 03 | [Ghi giao dịch nhanh (bottom sheet)](phase-03-quick-add-sheet.md) | completed | 01, 02 | agy high + Claude review |
| 04 | [Tổng quan](phase-04-dashboard.md) | completed | 02 | agy medium |
| 05 | [Danh sách giao dịch](phase-05-transactions-list.md) | completed | 03 | agy medium |
| 06 | [Ví · Vay/Nợ · Ngân sách](phase-06-wallets-debts-budgets.md) | completed | 01, 02 | agy medium |
| 07 | [Báo cáo · Cài đặt](phase-07-analytics-and-settings.md) | completed | 01, 02 | agy medium |
| 08 | [Tách state.js, gỡ global, dọn CSS](phase-08-state-split-and-cleanup.md) | completed | 03-07 | agy medium |
| 09 | [Kiểm thử toàn bộ + release](phase-09-verification-and-release.md) | pending | 01-08 | Claude |

Thứ tự: 01 → 02 → 03 → (04 ∥ 06 ∥ 07, khác file) → 05 → 08 → 09.

## Acceptance (toàn plan)
- Mọi màn hình chạy ở 375px và ≥1280px, cả theme sáng/tối, không lỗi console, không vi phạm CSP.
- Ghi 1 khoản chi: mở sheet → nhập tiền → chạm hạng mục → Lưu (ví/loại nhớ lần trước).
- Không file `js/**/*.js` nào > 200 dòng; không còn `window.appInstance|transactionModal|setAppTheme|getAppTheme|showToast`.
- `node --test "tests/*.test.mjs"` xanh; smoke test đủ luồng (thêm/sửa/xoá giao dịch, chuyển ví, vay/trả nợ, ngân sách, export/import, đăng nhập + sync).
- `tests/sw-assets.test.mjs` xanh (mọi file mới có trong `ASSETS_TO_CACHE`), `CACHE_NAME` bump.

## Rủi ro chung
- Viết lại UI làm mất hành vi cũ (validate trả nợ, chặn xoá ví đang dùng, che số) → mỗi phase liệt kê hành vi phải giữ; smoke test sau mỗi phase.
- CSP: không dùng inline `<script>`/`onclick=`; style inline vẫn được phép.
