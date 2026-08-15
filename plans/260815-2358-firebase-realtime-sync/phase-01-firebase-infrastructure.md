---
phase: 1
title: "Firebase Infrastructure & Auth Service"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 01: Firebase Infrastructure & Auth Service

## Overview
Khởi tạo nền tảng kết nối Firebase trên trình duyệt không dùng bundler qua Firebase v10 ES Modules CDN. Xây dựng dịch vụ quản lý xác thực `firebase-auth.js` hỗ trợ Đăng nhập Google (GoogleAuthProvider) và Đăng nhập Ẩn danh (Anonymous Auth).

## Requirements
- Functional:
  - Tải Firebase App và Firebase Auth từ ESM CDN `https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js` & `firebase-auth.js`.
  - Hỗ trợ lưu trữ thông tin cấu hình Firebase Config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) trong `state.settings.firebaseConfig` hoặc cấu hình mặc định.
  - Xử lý Google Sign-In Popup & Redirect an toàn.
  - Quản lý trạng thái phiên đăng nhập (`onAuthStateChanged`).
- Non-functional:
  - Không phá vỡ Service Worker offline caching.
  - Bắt lỗi mạng và thông báo thân thiện tới người dùng.

## Architecture
- `js/services/firebase-auth.js`: Singleton quản lý Auth state, `signInWithGoogle()`, `signInAnonymously()`, `signOut()`, `getCurrentUser()`.
- Lưu trữ trạng thái phiên và thông tin user (`uid`, `displayName`, `email`, `photoURL`) vào state store để UI cập nhật tự động.

## Related Code Files
- Create: `js/services/firebase-auth.js`
- Modify: `js/config.js`, `sw.js`

## Implementation Steps
1. Khai báo `DEFAULT_SETTINGS.firebaseConfig` trong `js/config.js`.
2. Tạo `js/services/firebase-auth.js` import Firebase Auth qua CDN ESM.
3. Thêm các hàm `initFirebase()`, `signInWithGoogle()`, `signOut()`, `onAuthChange()`.
4. Cập nhật `sw.js` thêm `js/services/firebase-auth.js` vào `ASSETS_TO_CACHE`.

## Success Criteria
- [ ] Khởi tạo Firebase App thành công trên trình duyệt mà không cần build step.
- [ ] Người dùng có thể đăng nhập Google tài khoản cá nhân, lấy được `userId` duy nhất.
