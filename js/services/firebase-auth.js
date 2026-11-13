/**
 * Firebase Authentication Service (ES Modules CDN via Lazy Loader)
 */
import { loadFirebaseSdk } from './firebase-sdk.js';
import { DEFAULT_FIREBASE_CONFIG } from '../config.js';

class FirebaseAuthService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.currentUser = null;
    this.authListeners = new Set();
    this.isInitialized = false;
    this.ready = null;
    this.authModule = null;
  }

  async init(config = DEFAULT_FIREBASE_CONFIG) {
    this.config = config;
    this.ready = (async () => {
      try {
        const { app: appModule, auth: authModule } = await loadFirebaseSdk();
        this.authModule = authModule;

        if (appModule.getApps().length === 0) {
          this.app = appModule.initializeApp(config);
        } else {
          this.app = appModule.getApp();
        }
        this.auth = authModule.getAuth(this.app);

        authModule.onAuthStateChanged(this.auth, (user) => {
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
        // Allow ensureReady() to retry later (e.g. after coming back online).
        this.ready = null;
        throw err;
      }
    })();

    return this.ready;
  }

  async ensureReady() {
    if (!this.ready) {
      return this.init(this.config || DEFAULT_FIREBASE_CONFIG);
    }
    return this.ready;
  }

  getAuthInstance() {
    return this.auth;
  }

  getAppInstance() {
    return this.app;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async signInWithGoogle() {
    try {
      await this.ensureReady();
      const { GoogleAuthProvider, signInWithPopup } = this.authModule;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (err) {
      console.error('Lỗi Đăng nhập Google Firebase:', err);
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
      await this.ensureReady();
      const { signInAnonymously } = this.authModule;
      const result = await signInAnonymously(this.auth);
      return result.user;
    } catch (err) {
      console.error('Lỗi Đăng nhập Ẩn danh:', err);
      throw err;
    }
  }

  async signOut() {
    try {
      await this.ensureReady();
      if (this.auth && this.authModule) {
        await this.authModule.signOut(this.auth);
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
