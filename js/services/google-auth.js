/**
 * Google Identity Services (GIS) OAuth 2.0 Client Flow
 */
import { stateStore } from '../state.js';

const STORAGE_KEY_TOKEN = 'quanlythuchi_google_access_token';
const STORAGE_KEY_EXPIRES = 'quanlythuchi_google_token_expires_at';

export class GoogleAuthService {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.onAuthSuccessCallback = null;
    this.loadPersistedToken();
  }

  loadPersistedToken() {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const savedExpires = Number(localStorage.getItem(STORAGE_KEY_EXPIRES)) || 0;
      // Nếu token còn hạn ít nhất 1 phút
      if (savedToken && Date.now() < savedExpires - 60000) {
        this.accessToken = savedToken;
        this.tokenExpiresAt = savedExpires;
      } else {
        this.clearPersistedToken();
      }
    } catch (e) {
      console.warn('Không thể đọc Google token từ localStorage:', e);
    }
  }

  savePersistedToken(token, expiresInSec = 3600) {
    this.accessToken = token;
    this.tokenExpiresAt = Date.now() + (Number(expiresInSec) || 3600) * 1000;
    try {
      localStorage.setItem(STORAGE_KEY_TOKEN, this.accessToken);
      localStorage.setItem(STORAGE_KEY_EXPIRES, String(this.tokenExpiresAt));
    } catch (e) {
      console.warn('Không thể lưu Google token vào localStorage:', e);
    }
  }

  clearPersistedToken() {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_EXPIRES);
    } catch (e) {}
  }

  init(clientId, onAuthSuccess) {
    if (onAuthSuccess) this.onAuthSuccessCallback = onAuthSuccess;
    if (!window.google?.accounts?.oauth2 || !clientId) return;

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse) => {
          if (tokenResponse.error !== undefined) {
            console.error('Google Auth Error:', tokenResponse);
            stateStore.setSyncStatus({ status: 'error', message: 'Lỗi đăng nhập Google: ' + tokenResponse.error });
            return;
          }

          this.savePersistedToken(tokenResponse.access_token, tokenResponse.expires_in);
          stateStore.setSyncStatus({ status: 'connected', message: 'Đã kết nối Google' });

          if (this.onAuthSuccessCallback) {
            this.onAuthSuccessCallback(this.accessToken);
          }
        }
      });
    } catch (err) {
      console.error('Failed to init GIS client:', err);
    }
  }

  signIn(promptMode = '') {
    const state = stateStore.getState();
    const clientId = state.settings.googleClientId;

    if (!clientId) {
      alert('Vui lòng nhập Google Client ID trong phần Cài đặt trước!');
      return;
    }

    if (!this.tokenClient) {
      this.init(clientId, this.onAuthSuccessCallback);
    }

    if (this.tokenClient) {
      // Dùng prompt: '' để Google tự nhận diện phiên đã cấp quyền mà không bắt xác nhận lại
      this.tokenClient.requestAccessToken({ prompt: promptMode });
    } else {
      alert('Google Identity Services SDK chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng!');
    }
  }

  signOut() {
    const currentToken = this.getValidToken();
    if (currentToken && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(currentToken, () => {
          this.clearPersistedToken();
          stateStore.setSyncStatus({ status: 'idle', message: 'Chưa kết nối Google' });
        });
      } catch (e) {
        this.clearPersistedToken();
        stateStore.setSyncStatus({ status: 'idle', message: 'Chưa kết nối Google' });
      }
    } else {
      this.clearPersistedToken();
      stateStore.setSyncStatus({ status: 'idle', message: 'Chưa kết nối Google' });
    }
  }

  getValidToken() {
    // 1. Kiểm tra bộ nhớ RAM
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }
    // 2. Thử nạp lại từ localStorage nếu vừa reload trang
    this.loadPersistedToken();
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }
    return null;
  }
}

export const googleAuthService = new GoogleAuthService();
