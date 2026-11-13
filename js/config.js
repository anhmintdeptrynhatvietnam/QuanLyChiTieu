/**
 * Default Configurations & Data Definitions
 */

export const DEFAULT_CATEGORIES = [
  // Expense Categories
  { id: 'cat-food', name: 'Ăn uống', type: 'expense', icon: 'utensils', color: '#f97316' },
  { id: 'cat-shopping', name: 'Mua sắm', type: 'expense', icon: 'shopping-bag', color: '#ec4899' },
  { id: 'cat-transport', name: 'Đi lại & Xe cộ', type: 'expense', icon: 'car', color: '#3b82f6' },
  { id: 'cat-housing', name: 'Nhà cửa & Tiện ích', type: 'expense', icon: 'home', color: '#8b5cf6' },
  { id: 'cat-bills', name: 'Hóa đơn (Điện/Nước/Net)', type: 'expense', icon: 'zap', color: '#eab308' },
  { id: 'cat-entertainment', name: 'Giải trí & Bạn bè', type: 'expense', icon: 'film', color: '#06b6d4' },
  { id: 'cat-health', name: 'Sức khỏe & Thuốc', type: 'expense', icon: 'heart-pulse', color: '#ef4444' },
  { id: 'cat-education', name: 'Học tập & Sách', type: 'expense', icon: 'graduation-cap', color: '#10b981' },
  { id: 'cat-other-expense', name: 'Chi tiêu khác', type: 'expense', icon: 'more-horizontal', color: '#64748b' },

  // Income Categories
  { id: 'cat-salary', name: 'Tiền lương', type: 'income', icon: 'banknote', color: '#10b981' },
  { id: 'cat-bonus', name: 'Thưởng & Tip', type: 'income', icon: 'award', color: '#f59e0b' },
  { id: 'cat-investment', name: 'Đầu tư & Cổ tức', type: 'income', icon: 'trending-up', color: '#3b82f6' },
  { id: 'cat-freelance', name: 'Việc làm thêm', type: 'income', icon: 'briefcase', color: '#8b5cf6' },
  { id: 'cat-other-income', name: 'Thu nhập khác', type: 'income', icon: 'plus-circle', color: '#06b6d4' }
];

export const DEFAULT_WALLETS = [
  {
    id: 'wallet-cash',
    name: 'Tiền mặt',
    type: 'cash',
    initialBalance: 2000000,
    currentBalance: 2000000,
    icon: 'wallet',
    color: '#10b981'
  },
  {
    id: 'wallet-bank',
    name: 'Tài khoản Ngân hàng',
    type: 'bank',
    initialBalance: 15000000,
    currentBalance: 15000000,
    icon: 'credit-card',
    color: '#3b82f6'
  },
  {
    id: 'wallet-credit',
    name: 'Thẻ tín dụng',
    type: 'credit',
    initialBalance: 0,
    currentBalance: 0,
    icon: 'landmark',
    color: '#8b5cf6'
  },
  {
    id: 'wallet-saving',
    name: 'Sổ tiết kiệm',
    type: 'saving',
    initialBalance: 50000000,
    currentBalance: 50000000,
    icon: 'piggy-bank',
    color: '#f59e0b'
  }
];

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAsGNbZ8U_YTiLcUWJtVD-uqu5zTdjhDBg",
  authDomain: "sothuchi-5f58e.firebaseapp.com",
  databaseURL: "https://sothuchi-5f58e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sothuchi-5f58e",
  storageBucket: "sothuchi-5f58e.firebasestorage.app",
  messagingSenderId: "375858739110",
  appId: "1:375858739110:web:c995da1d3802dc491d8167"
};

export const DEFAULT_SETTINGS = {
  currency: 'VND',
  currencySymbol: '₫',
  theme: 'light',
  syncProvider: 'firebase',
  firebaseConfig: DEFAULT_FIREBASE_CONFIG,
  firebaseUser: null
};

export const LEGACY_LOCAL_STORAGE_KEYS = ['quanlythuchi_google_access_token', 'quanlythuchi_google_token_expires_at'];

export const STORAGE_KEYS = {
  TRANSACTIONS: 'qlct_transactions',
  WALLETS: 'qlct_wallets',
  CATEGORIES: 'qlct_categories',
  BUDGETS: 'qlct_budgets',
  DEBTS: 'qlct_debts',
  SETTINGS: 'qlct_settings'
};

export const CATEGORY_PALETTE = [
  '#f97316', // Cam (Ăn uống)
  '#3b82f6', // Xanh dương (Đi lại/Đầu tư)
  '#10b981', // Xanh lục (Học tập/Lương)
  '#ec4899', // Hồng (Mua sắm)
  '#8b5cf6', // Tím (Nhà cửa/Làm thêm)
  '#eab308', // Vàng (Hóa đơn)
  '#06b6d4', // Cyan (Giải trí)
  '#ef4444', // Đỏ (Sức khỏe)
  '#14b8a6', // Teal (Thể thao / Tiện ích)
  '#f59e0b', // Hổ phách (Thưởng)
  '#6366f1', // Chàm (Công nghệ)
  '#84cc16', // Chanh (Du lịch)
  '#d946ef', // Fuchsia (Làm đẹp)
  '#0284c7', // Xanh biển đậm
  '#64748b'  // Xám slate (Khác)
];
