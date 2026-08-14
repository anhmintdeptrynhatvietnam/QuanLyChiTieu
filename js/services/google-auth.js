/**
 * Google Identity Services (GIS) OAuth 2.0 Client Flow
 */
import { stateStore } from '../state.js';

export class GoogleAuthService {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.onAuthSuccessCallback = null;
  }

  init(clientId, onAuthSuccess) {
    this.onAuthSuccessCallback = onAuthSuccess;
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

          this.accessToken = tokenResponse.access_token;
          this.tokenExpiresAt = Date.now() + (Number(tokenResponse.expires_in) || 3600) * 1000;
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

  signIn() {
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
      // Prompt user for consent
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      alert('Google Identity Services SDK chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng!');
    }
  }

  signOut() {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(this.accessToken, () => {
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        stateStore.setSyncStatus({ status: 'idle', message: 'Chưa kết nối Google' });
      });
    } else {
      this.accessToken = null;
      this.tokenExpiresAt = 0;
      stateStore.setSyncStatus({ status: 'idle', message: 'Chưa kết nối Google' });
    }
  }

  getValidToken() {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }
    return null;
  }
}

export const googleAuthService = new GoogleAuthService();
