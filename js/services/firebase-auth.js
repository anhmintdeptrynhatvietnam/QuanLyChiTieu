/**
 * Firebase Authentication Service (ES Modules CDN)
 */
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { DEFAULT_FIREBASE_CONFIG } from '../config.js';

class FirebaseAuthService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.currentUser = null;
    this.authListeners = new Set();
    this.isInitialized = false;
  }

  init(config = DEFAULT_FIREBASE_CONFIG) {
    try {
      if (getApps().length === 0) {
        this.app = initializeApp(config);
      } else {
        this.app = getApp();
      }
      this.auth = getAuth(this.app);
      
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user ? {
          uid: user.uid,
          displayName: user.displayName || (user.isAnonymous ? 'Khách (Ẩn danh)' : 'Người dùng'),
          email: user.email || '',
          photoURL: user.photoURL || '',
          isAnonymous: user.isAnonymous
        } : null;

        this.notifyAuthListeners(this.currentUser);
      });

      this.isInitialized = true;
      return this.auth;
    } catch (err) {
      console.error('Lỗi khởi tạo Firebase Auth:', err);
      throw err;
    }
  }

  getAuthInstance() {
    if (!this.auth) {
      this.init();
    }
    return this.auth;
  }

  getAppInstance() {
    if (!this.app) {
      this.init();
    }
    return this.app;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async signInWithGoogle() {
    try {
      this.getAuthInstance();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (err) {
      console.error('Lỗi Đăng nhập Google Firebase:', err);
      // Xử lý các mã lỗi phổ biến
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Bạn đã đóng cửa sổ đăng nhập trước khi hoàn tất.');
      } else if (err.code === 'auth/unauthorized-domain') {
        throw new Error('Tên miền hiện tại chưa được cấp quyền trong Firebase Console (Authentication -> Settings -> Authorized domains).');
      }
      throw err;
    }
  }

  async signInAsGuest() {
    try {
      this.getAuthInstance();
      const result = await signInAnonymously(this.auth);
      return result.user;
    } catch (err) {
      console.error('Lỗi Đăng nhập Ẩn danh:', err);
      throw err;
    }
  }

  async signOut() {
    try {
      if (this.auth) {
        await signOut(this.auth);
      }
      this.currentUser = null;
      this.notifyAuthListeners(null);
    } catch (err) {
      console.error('Lỗi Đăng xuất Firebase:', err);
      throw err;
    }
  }

  onAuthChange(callback) {
    this.authListeners.add(callback);
    // Gọi ngay lần đầu nếu đã có currentUser
    if (this.isInitialized) {
      callback(this.currentUser);
    }
    return () => this.authListeners.delete(callback);
  }

  notifyAuthListeners(user) {
    this.authListeners.forEach(fn => {
      try {
        fn(user);
      } catch (e) {
        console.error('Lỗi trong auth listener callback:', e);
      }
    });
  }
}

export const firebaseAuthService = new FirebaseAuthService();
