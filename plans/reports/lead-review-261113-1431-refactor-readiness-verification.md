# Đối chiếu & bổ sung audit refactor — Sổ Thu Chi

- Ngày: 2026-11-13
- Báo cáo gốc (agy): [agy-audit-261113-1418-refactor-readiness.md](agy-audit-261113-1418-refactor-readiness.md)
- Phạm vi: đối chiếu lại các finding chính với source, chỉnh severity, bổ sung lỗi bị sót. Không sửa source.

## 1. Finding đã xác nhận trực tiếp trong code

| ID agy | Kết luận | Bằng chứng |
|---|---|---|
| BUG-01 timer debounce dùng chung | ĐÚNG — Critical | `js/services/firebase-sync.js:145-154` một `pushTimeout` cho mọi bảng |
| BUG-02 multi-tab bị chặn | ĐÚNG — High | `firebase-sync.js:31-36` deviceId trong localStorage, `:104` bỏ qua snapshot cùng deviceId |
| BUG-03 `data:imported` không đẩy Firebase | ĐÚNG — nâng lên Critical | `js/state.js:129-147` không có nhánh; nút push-all đã bị bỏ khỏi UI (xem BUG-07) nên user không có cách đẩy lại |
| BUG-04 xoá category không sync budgets | ĐÚNG — High | `state.js:283-284` |
| BUG-05 xoá ví không kiểm tra debts | ĐÚNG — High | `state.js:243-250` |
| BUG-08 toast innerHTML | ĐÚNG — Medium | `js/components/toast.js:36-39`; `settings.js:408` chèn `user.displayName` (Google) không escape |
| BUG-11 privacy.js thiếu trong SW | ĐÚNG | `sw.js:7-42`; import tại `dashboard.js:7`, `wallets.js:8`, `debts.js:8` |
| File > 200 dòng | ĐÚNG | settings.js 716, debts.js 597, css/components.css 514, transaction-modal.js 485, state.js 476 |
| CDN không pin version | ĐÚNG | `index.html:35` `lucide@latest`, `:36` `chart.js` không version |
| Docs drift (không có Firebase, nhắc IndexedDB) | ĐÚNG | README, docs/system-architecture.md |

## 2. Finding cần chỉnh lại

- **BUG-07 (High → Low, dead code):** `settings.js:461-462, 479-480` có `if (btn)` bảo vệ → không crash. Chỉ là code chết vì template không còn nút. Hệ quả thật: không có UI "đẩy toàn bộ lên Cloud" → làm BUG-03 nặng hơn.
- **BUG-06 (High → Low):** debts mất `updatedAt` khi qua Sheets (`google-sheets.js:106`), nhưng Pull từ Sheets đang tắt (`settings.js:214, 662`; `sync-modal.js:138, 265`). Chỉ quan trọng nếu bật lại Pull.
- **BUG-12:** không phải bug (gọi recalc lúc init, chi phí nhỏ). Bỏ.
- **6.2 firebaseUser:** chỉ chứa `{uid, displayName, email, photoURL, isAnonymous}` (`firebase-auth.js:34-40`), KHÔNG có token. Vẫn là PII bị export vào JSON backup (`export-import.js:10`).
- **6.3 Firebase apiKey trong `config.js:64-72`:** apiKey web của Firebase vốn công khai theo thiết kế; rủi ro thật nằm ở Firestore Security Rules — rules KHÔNG có trong repo. [Unverified] cô lập dữ liệu giữa các user trên project `sothuchi-5f58e`.

## 3. Lỗi bổ sung (agy chưa nêu)

| ID | Severity | Vị trí | Kịch bản | Tác động |
|---|---|---|---|---|
| ADD-01 | High | `state.js:8-9`, `firebase-sync.js:4-13` | Firebase SDK import tĩnh từ gstatic; SW không cache response cross-origin (`sw.js:81` chỉ cache `type === 'basic'`) | [Inference] gstatic lỗi/offline + HTTP cache trống → cả graph module `state.js` fail → app trắng trang, không chỉ mất sync |
| ADD-02 | High | `firebase-sync.js:161-165` | Mỗi bảng là 1 document chứa toàn bộ mảng `items` | [Inference, theo giới hạn 1 MiB/document của Firestore] dữ liệu giao dịch nhiều năm sẽ vượt giới hạn → ghi thất bại; mọi lần sửa 1 giao dịch đẩy lại toàn bộ mảng |
| ADD-03 | High | `firebase-sync.js:157-166`, `state.js:65-87` | 2 thiết bị cùng sửa (nhất là offline) | Last-write-wins theo cả bảng → thay đổi của 1 thiết bị bị mất toàn bộ, không merge theo record |
| ADD-04 | Medium-High | `state.js:36-53` | Đổi tài khoản A→B khi B đã có cloud nhưng thiếu 1 vài bảng (vd chưa có doc `debts`) | [Inference] dữ liệu bảng đó của A còn trong state, lần thay đổi kế tiếp đẩy lên cloud của B → lẫn dữ liệu giữa tài khoản. Lần đăng nhập đầu (không có `lastAuthUid`) dữ liệu local cũng không được đẩy lên |
| ADD-05 | Medium | `state.js:331` | Ghi trả nợ cho khoản đã `paid` (remainingAmount = 0) | `Number(0) \|\| debt.amount` → lấy lại toàn bộ amount, status quay về `partially_paid` |
| ADD-06 | Low | `state.js:191` | Sửa giao dịch về amount 0 | `Number(0) \|\| old` → không cho đặt 0 (có thể chấp nhận nếu 0 là không hợp lệ) |
| ADD-07 | Low | `export-import.js:33-35` | Tên hạng mục/ví chứa dấu `"` hoặc bắt đầu bằng `=` | CSV hỏng cột; công thức bị Excel thực thi (CSV injection). Chỉ `note` được escape `"` |

## 4. Thứ tự refactor khuyến nghị (chỉnh từ backlog của agy)

0. **Lưới an toàn test** — cần quyết định (xem Q4). Ưu tiên test thuần cho `recalculateWalletBalances`, `recordRepayment`, `notify→scheduleSync`.
1. **Chặn mất dữ liệu sync:** BUG-01, BUG-03 (+ khôi phục nút push-all), BUG-04, BUG-02, ADD-04.
2. **Toàn vẹn sổ tiền:** BUG-05, BUG-09, ADD-05.
3. **Khả năng chạy offline:** ADD-01 (dynamic import Firebase / cache CDN), BUG-11, bump `CACHE_NAME`, pin version CDN.
4. **Bảo mật:** BUG-08 (textContent), lọc PII khỏi JSON export, ADD-07, CSP.
5. **Mô hình dữ liệu cloud:** ADD-02/ADD-03 — chuyển sang 1 document/record (`users/{uid}/transactions/{id}`) + migration. Thay đổi lớn nhất, cần quyết định Q1.
6. **Tách module < 200 dòng:** settings.js, debts.js, transaction-modal.js, state.js, base-modal dùng chung, gỡ global `window.*`.
7. **Docs:** README, system-architecture, changelog theo hiện trạng Firebase.

Lý do đổi thứ tự so với agy: tách module (rủi ro regression cao, không có test) phải sau khi logic tiền và sync đã có test khoá hành vi; mô hình dữ liệu cloud đặt trước tách module vì nó đổi interface `firebase-sync` ↔ `state`.

## 5. Quyết định của chủ dự án (2026-11-13)

1. **Bỏ hoàn toàn Google Sheets.** Gỡ `google-auth.js`, `google-sheets.js`, `sync-modal.js` và UI liên quan; chỉ giữ Firebase + export/import JSON/CSV. Hệ quả: BUG-06 và phantom tab `Settings` tự hết; dọn `googleClientId`/`spreadsheetId` khỏi `DEFAULT_SETTINGS` (cần migrate settings cũ trong localStorage), bỏ bypass `googleapis.com` trong `sw.js`, bỏ script GIS trong `index.html`.
2. **Giữ project Firebase mặc định `sothuchi-5f58e`, bổ sung `firestore.rules` vào repo** (chỉ cho phép `request.auth.uid == uid` trên `users/{uid}/**`). Deploy rules là việc user tự làm trên Firebase Console/CLI.
3. **Đổi schema Firestore sang 1 document/record, có migration** từ `users/{uid}/data/{table}` (mảng) sang collection theo bản ghi. Bắt buộc backup JSON trước migration.
4. **Cho phép `tests/` chạy bằng `node --test`** (không package.json, không thư viện ngoài). Cập nhật CLAUDE.md ghi nhận lệnh test.

Thứ tự ở mục 4 giữ nguyên; thêm bước "Gỡ Google Sheets" ngay sau bước 0 (giảm diện tích code trước khi sửa sync).
