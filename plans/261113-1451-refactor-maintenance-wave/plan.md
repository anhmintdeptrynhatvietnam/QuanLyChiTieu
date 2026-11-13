---
title: "Refactor & bảo trì lớn Sổ Thu Chi"
status: in-progress
mode: fast
created: 2026-11-13
blockedBy: []
blocks: []
---

# Refactor & bảo trì lớn Sổ Thu Chi

## Mục tiêu
Sửa các lỗi mất dữ liệu/lệch sổ tiền, bỏ Google Sheets, chuyển Firestore sang 1 document/bản ghi (có migration), chạy offline đúng, vá bảo mật, tách file > 200 dòng, docs khớp code. Có test `node --test` khoá hành vi trước khi sửa logic.

## Nguồn
- Audit: [agy-audit-261113-1418-refactor-readiness.md](../reports/agy-audit-261113-1418-refactor-readiness.md)
- Đối chiếu + quyết định chốt (mục 5): [lead-review-261113-1431-refactor-readiness-verification.md](../reports/lead-review-261113-1431-refactor-readiness-verification.md)

## Quyết định đã chốt (2026-11-13)
1. Bỏ hoàn toàn Google Sheets (Firebase là cloud duy nhất; giữ export/import JSON/CSV).
2. Giữ Firebase project mặc định `sothuchi-5f58e`; thêm `firestore.rules` vào repo.
3. Firestore 1 document/bản ghi + migration dữ liệu cloud cũ.
4. Cho phép `tests/` chạy bằng `node --test` (không package.json, không dependency).

## Phases

| # | Phase | Status | Phụ thuộc | Ước lượng | Thực thi |
|---|---|---|---|---|---|
| 01 | [Test harness + tách domain thuần](phase-01-test-harness-and-domain-extraction.md) | completed | — | 0.5d | agy medium |
| 02 | [Gỡ Google Sheets](phase-02-remove-google-sheets.md) | completed | 01 | 0.5d | agy medium |
| 03 | [Toàn vẹn sổ tiền](phase-03-ledger-integrity.md) | completed | 01 | 0.5d | agy medium |
| 04 | [Firestore 1 doc/bản ghi + sync engine mới + rules](phase-04-firestore-per-record-sync.md) | completed | 01, 02 | 1.5d | agy high + Claude review rules |
| 05 | [Migration cloud cũ + đổi tài khoản](phase-05-cloud-migration-and-account-switch.md) | completed | 04 | 1d | Claude trực tiếp (thao tác dữ liệu) |
| 06 | [Offline/PWA](phase-06-offline-pwa.md) | pending | 04 | 0.5d | agy medium |
| 07 | [Bảo mật & riêng tư](phase-07-security-hardening.md) | pending | 02 | 0.5d | agy medium |
| 08 | [Tách module < 200 dòng](phase-08-modularization.md) | pending | 03, 05, 06, 07 | 2d | agy high |
| 09 | [Đồng bộ tài liệu](phase-09-docs-alignment.md) | pending | 08 | 0.5d | agy medium |

Thứ tự chạy: 01 → (02 ∥ 03) → 04 → 05 → (06 ∥ 07) → 08 → 09. Các cặp ∥ không đụng chung file nhưng vẫn làm tuần tự trong cùng checkout cho an toàn.

## Tiêu chí hoàn thành toàn plan
- [ ] `node --test "tests/*.test.mjs"` xanh, bao phủ: tính số dư ví, trả nợ, diff đồng bộ, migration mapping.
- [ ] Không còn file/tham chiếu Google Sheets (`grep -ri "sheets\|gsi/client\|googleClientId" js index.html` rỗng, trừ Firebase Google sign-in).
- [ ] Firestore dữ liệu ở `users/{uid}/{collection}/{id}`; dữ liệu cũ `users/{uid}/data/*` được migrate, không bị xoá.
- [ ] `firestore.rules` trong repo, chỉ chủ sở hữu đọc/ghi `users/{uid}/**`.
- [ ] App mở offline (sau 1 lần online) không trắng trang; mọi file JS/CSS nằm trong `ASSETS_TO_CACHE`.
- [ ] Không file JS nào > 200 dòng (CSS được phép ngoại lệ nếu ghi rõ).
- [ ] README, `docs/*`, CLAUDE.md mô tả đúng hiện trạng.
- [ ] Smoke test thủ công (dưới đây) pass sau mỗi phase có đụng UI.

## Smoke test thủ công (dùng chung)
Chạy bằng Live Server, DevTools mở Console (không có lỗi đỏ):
1. Thêm chi/thu/chuyển tiền → số dư ví đúng; sửa, xoá giao dịch → số dư đúng.
2. Thêm khoản cho vay + đi vay, trả nợ một phần, trả hết → số dư ví và trạng thái đúng.
3. Đặt/xoá ngân sách; xoá hạng mục có ngân sách.
4. Đăng nhập Firebase (ẩn danh), sửa dữ liệu, mở tab thứ 2 → tab 2 thấy thay đổi.
5. Export JSON → Import lại → dữ liệu trên cloud cập nhật.
6. DevTools → Offline → reload → app vẫn chạy.
7. Đổi theme sáng/tối, ẩn/hiện số tiền.

## Quy trình Gehihi cho mỗi phase
Claude viết brief cho agy (mục tiêu, file được sửa/cấm, tiêu chí, test cần viết, "không chạy lệnh"), agy sửa file, Claude đọc diff + chạy `node --test "tests/*.test.mjs"` + smoke test liên quan, phản hồi trong cùng conversation tối đa ~3 vòng.

## Rủi ro chung
- Không có test UI tự động → regression giao diện chỉ bắt được bằng smoke test thủ công.
- Phase 04–05 đụng dữ liệu cloud thật của người dùng → luôn export JSON trước khi chạy thử trên tài khoản thật; thử trên tài khoản ẩn danh trước.

## Ghi chú
- Plan accessor `.claude/scripts/fis-plan.cjs` đang lỗi (thiếu `.claude/skills/_shared/lib/plan-table-parser.cjs`) → cập nhật cột Status bằng tay.
- Plan `260814-1453-quan-ly-chi-tieu-fe-google-sheets` và `260815-0006-two-way-google-sheets-sync`: phần Google Sheets bị thay thế bởi phase 02 của plan này.

## Câu hỏi chưa giải quyết
- Không có (4 quyết định đã chốt). Câu hỏi phát sinh trong phase sẽ ghi vào phase tương ứng.
