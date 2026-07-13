import axios from 'axios';
import { storage } from '@/src/utils/storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const ACCESS_KEY = 'emergent_access_token';
const REFRESH_KEY = 'emergent_refresh_token';
const USER_KEY = 'emergent_user';

export const tokenStore = {
  getAccess: () => storage.secureGet(ACCESS_KEY, ''),
  getRefresh: () => storage.secureGet(REFRESH_KEY, ''),
  getUser: async () => {
    const raw = await storage.getItem(USER_KEY, '');
    if (!raw) return null;
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
  },
  set: async ({ access_token, refresh_token, user }: { access_token?: string; refresh_token?: string; user?: any }) => {
    if (access_token) await storage.secureSet(ACCESS_KEY, access_token);
    if (refresh_token) await storage.secureSet(REFRESH_KEY, refresh_token);
    if (user) await storage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser: (user: any) => storage.setItem(USER_KEY, JSON.stringify(user)),
  clear: async () => {
    await storage.secureRemove(ACCESS_KEY);
    await storage.secureRemove(REFRESH_KEY);
    await storage.removeItem(USER_KEY);
  },
};

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const access = await tokenStore.getAccess();
  if (access) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error;
    if (!response || response.status !== 401 || config?._retry) {
      return Promise.reject(error);
    }
    const refresh = await tokenStore.getRefresh();
    if (!refresh) {
      await tokenStore.clear();
      return Promise.reject(error);
    }
    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE}/v1/auth/refresh`, { refresh_token: refresh })
          .then(async (res) => {
            await tokenStore.set({
              access_token: res.data.access_token,
              refresh_token: res.data.refresh_token,
            });
            return res.data.access_token;
          })
          .finally(() => { refreshPromise = null; });
      }
      const newAccess = await refreshPromise;
      config._retry = true;
      config.headers.Authorization = `Bearer ${newAccess}`;
      return api.request(config);
    } catch (e) {
      await tokenStore.clear();
      return Promise.reject(e);
    }
  }
);

export default api;

// ---- Auth API helpers ----
export const authApi = {
  sendOtp: (phone: string) => api.post('/v1/auth/otp/send', { phone }),
  verifyOtp: (payload: any) => api.post('/v1/auth/otp/verify', payload),
  refresh: (refresh_token: string) => api.post('/v1/auth/refresh', { refresh_token }),
  logout: (refresh_token: string) => api.post('/v1/auth/logout', { refresh_token }),
};

export const userApi = {
  me: () => api.get('/v1/users/me'),
  update: (payload: any) => api.patch('/v1/users/me', payload),
  switchRole: (role: string) => api.post('/v1/users/me/switch-role', { role }),
  addRole: (role: string) => api.post('/v1/users/me/add-role', { role }),
};

// ---- Categories ----
export const categoryApi = {
  list: (params: any = {}) => api.get('/v1/categories/', { params }),
  bySlug: (slug: string) => api.get(`/v1/categories/${slug}`),
};

// ---- Listings ----
export const listingApi = {
  list: (params: any = {}) => api.get('/v1/listings/', { params }),
  bySlug: (slug: string) => api.get(`/v1/listings/${slug}`),
  create: (body: any, becomeVendor = false) =>
    api.post(`/v1/listings/${becomeVendor ? '?become_vendor=true' : ''}`, body),
  update: (id: string, body: any) => api.patch(`/v1/listings/${id}`, body),
  setStatus: (id: string, status: string) => api.post(`/v1/listings/${id}/status`, { status }),
  remove: (id: string) => api.delete(`/v1/listings/${id}`),
  mine: () => api.get('/v1/listings/vendor/me'),
};

// ---- Media ----
export const mediaApi = {
  sign: (folder: string, resource_type: string) => api.post('/v1/media/sign', { folder, resource_type }),
  upload: (formData: FormData) => api.post('/v1/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${BACKEND_URL}${url}`;
}

// ---- Feed ----
export const feedApi = {
  main: (params: any = {}) => api.get('/v1/feed/', { params }),
  reels: (params: any = {}) => api.get('/v1/feed/reels', { params }),
};

// ---- Follow ----
export const followApi = {
  follow: (userId: string) => api.post(`/v1/follows/${userId}`),
  unfollow: (userId: string) => api.delete(`/v1/follows/${userId}`),
  myFollowing: () => api.get('/v1/follows/me/following'),
};

// ---- Interactions ----
export const interactionApi = {
  toggleLike: (id: string) => api.post(`/v1/listings/${id}/like`),
  toggleSave: (id: string) => api.post(`/v1/listings/${id}/save`),
  mySaved: () => api.get('/v1/interactions/me/saved'),
  myLiked: () => api.get('/v1/interactions/me/liked'),
};

// ---- Search ----
export const searchApi = {
  search: (params: any) => api.get('/v1/search/', { params }),
  suggest: (q: string) => api.get('/v1/search/suggest', { params: { q } }),
};

// ---- Vendors ----
export const vendorApi = {
  get: (id: string) => api.get(`/v1/vendors/${id}`),
  listings: (id: string) => api.get(`/v1/vendors/${id}/listings`),
};

// ---- Watch ----
export const watchApi = {
  watch: (listingId: string, phone: string) => api.post(`/v1/listings/${listingId}/watch`, { phone }),
};

// ---- Chat ----
export const chatApi = {
  createThread: (body: any) => api.post('/v1/chat/threads', body),
  myThreads: () => api.get('/v1/chat/threads/me'),
  getThread: (id: string) => api.get(`/v1/chat/threads/${id}`),
  messages: (id: string, params: any = {}) => api.get(`/v1/chat/threads/${id}/messages`, { params }),
  send: (id: string, body: any) => api.post(`/v1/chat/threads/${id}/messages`, body),
  read: (id: string) => api.post(`/v1/chat/threads/${id}/read`),
  archive: (id: string) => api.post(`/v1/chat/threads/${id}/archive`),
  unreadTotal: () => api.get('/v1/chat/unread-total'),
};

// ---- Deals ----
export const dealApi = {
  create: (body: any) => api.post('/v1/deals/', body),
  mine: (params: any = {}) => api.get('/v1/deals/me', { params }),
  get: (id: string) => api.get(`/v1/deals/${id}`),
  counter: (id: string, body: any) => api.post(`/v1/deals/${id}/counter`, body),
  accept: (id: string) => api.post(`/v1/deals/${id}/accept`),
  reject: (id: string) => api.post(`/v1/deals/${id}/reject`),
  cancel: (id: string) => api.post(`/v1/deals/${id}/cancel`),
  complete: (id: string) => api.post(`/v1/deals/${id}/complete`),
};

// ---- Wallet ----
export const walletApi = {
  me: () => api.get('/v1/wallet/me'),
  transactions: (params: any = {}) => api.get('/v1/wallet/me/transactions', { params }),
  topup: (amount_paise: number) => api.post('/v1/wallet/me/topup', { amount_paise }),
};

export const paymentApi = {
  simulate: (payment_id: string) => api.post(`/v1/payments/dev/simulate-success?payment_id=${payment_id}`),
};

// ---- Subscriptions ----
export const subApi = {
  subscribe: (plan: string) => api.post('/v1/subscriptions/subscribe', { plan }),
  mine: () => api.get('/v1/subscriptions/me'),
  cancel: (id: string) => api.post(`/v1/subscriptions/${id}/cancel`),
};

// ---- KYC ----
export const kycApi = {
  submit: (body: any) => api.post('/v1/kyc/me/submit', body),
  me: () => api.get('/v1/kyc/me'),
};

// ---- Reviews ----
export const reviewApi = {
  create: (body: any) => api.post('/v1/reviews/', body),
  list: (params: any) => api.get('/v1/reviews/', { params }),
  vendorSummary: (id: string) => api.get(`/v1/reviews/vendor/${id}/summary`),
};

// ---- Notifications ----
export const notifApi = {
  list: (params: any = {}) => api.get('/v1/notifications/me', { params }),
  unreadCount: () => api.get('/v1/notifications/me/unread-count'),
  read: (id: string) => api.post(`/v1/notifications/${id}/read`),
  readAll: () => api.post('/v1/notifications/me/read-all'),
};

// ---- Trust ----
export const trustApi = {
  score: (userId: string) => api.get(`/v1/users/${userId}/trust-score`),
};

// ---- Track ----
export const trackApi = {
  listing: (listingId: string, event: string) => api.post(`/v1/listings/${listingId}/track`, { event }),
};

// ---- Requirements ----
export const requirementApi = {
  create: (body: any) => api.post('/v1/requirements/', body),
  list: (params: any = {}) => api.get('/v1/requirements/', { params }),
  get: (id: string) => api.get(`/v1/requirements/${id}`),
};

// ---- Proposals ----
export const proposalApi = {
  create: (body: any) => api.post('/v1/proposals/', body),
  accept: (id: string) => api.post(`/v1/proposals/${id}/accept`),
};

// ---- Referral ----
export const referralApi = {
  mine: () => api.get('/v1/users/me/referrals/'),
};

// ---- Onboarding Checklist ----
export const onboardingApi = {
  checklist: () => api.get('/v1/users/me/onboarding-checklist'),
};

// ---- Boost ----
export const boostApi = {
  boost: (listingId: string, duration_days: number, payment_method = 'credits') =>
    api.post(`/v1/listings/${listingId}/boost`, { duration_days, payment_method }),
  mine: () => api.get('/v1/listings/vendor/me/boosted'),
};

// ---- Analytics ----
export const analyticsApi = {
  overview: (range = '30d') => api.get('/v1/vendor/analytics/overview', { params: { range } }),
  listings: (params: any = {}) => api.get('/v1/vendor/analytics/listings', { params }),
  timeseries: (range = '30d', metric = 'views') => api.get('/v1/vendor/analytics/timeseries', { params: { range, metric } }),
};
