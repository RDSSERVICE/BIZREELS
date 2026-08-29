import axios from "axios";

const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || '';
const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '');
export const API_BASE = import.meta.env.VITE_API_URL || (BACKEND_URL ? `${BACKEND_URL}/api` : '/api');

const ACCESS_KEY = "bizreels_access_token";
const REFRESH_KEY = "bizreels_refresh_token";
const USER_KEY = "bizreels_user";

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`localStorage setItem failed for key "${key}":`, e);
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882) {
      try {
        console.warn('Quota exceeded. Clearing non-essential items from localStorage...');
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k !== ACCESS_KEY && k !== REFRESH_KEY && k !== USER_KEY && k !== 'accessToken' && k !== 'refreshToken' && k !== 'user') {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(key, value);
        console.log(`Successfully set key "${key}" after clearing non-essential items.`);
      } catch (retryError) {
        console.error('Failed to write to localStorage even after cleaning:', retryError);
      }
    }
  }
};

export const tokenStore = {
  getAccess: () => {
    try {
      return localStorage.getItem(ACCESS_KEY) || localStorage.getItem("accessToken");
    } catch {
      return null;
    }
  },
  getRefresh: () => {
    try {
      return localStorage.getItem(REFRESH_KEY) || localStorage.getItem("refreshToken");
    } catch {
      return null;
    }
  },
  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY) || localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: ({ user, accessToken, refreshToken }) => {
    if (user) safeSetItem(USER_KEY, JSON.stringify(user));
    if (accessToken) safeSetItem(ACCESS_KEY, accessToken);
    if (refreshToken) safeSetItem(REFRESH_KEY, refreshToken);
  },
  setUser: (user) => safeSetItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    } catch (e) {
      console.error('Failed to clear tokens from localStorage:', e);
    }
  },
};

const api = axios.create({ baseURL: API_BASE, withCredentials: true });
export { api };

// Request interceptor: attach Authorization header from localStorage if available,
// cookies also handle auth as fallback via withCredentials.
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh-on-401 with single-flight lock
let refreshPromise = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error;
    if (!response || response.status !== 401 || config?._retry) {
      return Promise.reject(error);
    }
    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE}/v1/auth/refresh`, { refreshToken: tokenStore.getRefresh() }, { withCredentials: true })
          .then((res) => {
            const data = res.data?.data || res.data;
            const newAccess = data?.accessToken || data?.access_token;
            const newRefresh = data?.refreshToken || data?.refresh_token;
            if (newAccess) {
              tokenStore.set({
                accessToken: newAccess,
                refreshToken: newRefresh,
              });
            }
            return newAccess;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newAccess = await refreshPromise;
      config._retry = true;
      if (newAccess) {
        config.headers.Authorization = `Bearer ${newAccess}`;
      }
      return api.request(config);
    } catch (e) {
      tokenStore.clear();
      if (typeof window !== "undefined") window.location.assign("/login");
      return Promise.reject(e);
    }
  }
);

export default api;

// ---- Auth API helpers ----
export const authApi = {
  sendOtp: (phone) => api.post("/v1/auth/otp/send", { phone }),
  verifyOtp: ({ phone, otp, name, roles }) =>
    api.post("/v1/auth/otp/verify", { phone, otp, name, roles }),
  refresh: () => api.post("/v1/auth/refresh", {}),
  logout: () => api.post("/v1/auth/logout", {}),
  googleSessionExchange: (session_id) =>
    api.post("/v1/auth/google/session-exchange", { session_id }),
};

export const userApi = {
  me: () => api.get("/v1/users/me"),
  update: (payload) => api.patch("/v1/users/me", payload),
  switchRole: (role) => api.post("/v1/users/me/switch-role", { role }),
  addRole: (role) => api.post("/v1/users/me/add-role", { role }),
  roleActivity: () => api.get("/v1/users/me/role-activity"),
};

export const cartApi = {
  mine: () => api.get("/v1/cart/me"),
  add: (payload) => api.post("/v1/cart/me/add", payload),
  update: (listing_id, quantity) => api.patch(`/v1/cart/me/items/${listing_id}`, { quantity }),
  remove: (listing_id) => api.delete(`/v1/cart/me/items/${listing_id}`),
  checkout: (payload = {}) => api.post("/v1/cart/me/checkout", payload),
};

export const offersApi = {
  active: () => api.get("/v1/offers/active"),
  validateCoupon: (payload) => api.post("/v1/offers/validate-coupon", payload),
  getApplicable: (params = {}) => api.get("/v1/offers/applicable", { params }),
  calculateShipping: (payload) => api.post("/v1/offers/calculate-shipping", payload),
  trackClick: (id) => api.post(`/v1/offers/${id}/click`),
};

export const moreFromVendor = (vendor_id, exclude_listing_id, limit = 12) =>
  api.get(`/v1/listings/vendor/${vendor_id}/related`, { params: { exclude_listing_id, limit } });

// ---- Categories ----
export const categoryApi = {
  list: (params = {}) => api.get("/v1/categories/", { params }),
  bySlug: (slug) => api.get(`/v1/categories/${slug}`),
};

// ---- Listings ----
export const listingApi = {
  list: (params = {}) => api.get("/v1/listings/", { params }),
  bySlug: (slug) => api.get(`/v1/listings/${slug}`),
  create: (body, becomeVendor = false) =>
    api.post(`/v1/listings/${becomeVendor ? "?become_vendor=true" : ""}`, body),
  update: (id, body) => api.patch(`/v1/listings/${id}`, body),
  setStatus: (id, status) => api.post(`/v1/listings/${id}/status`, { status }),
  remove: (id) => api.delete(`/v1/listings/${id}`),
  mine: () => api.get("/v1/listings/vendor/me"),
};

// ---- Media ----
export const mediaApi = {
  sign: (folder, resource_type) => api.post("/v1/media/sign", { folder, resource_type }),
  upload: (file, folder = "listings/misc", resource_type = "image", onProgress) => {
    const form = new FormData();
    const isImage = resource_type === "image";
    form.append(isImage ? "image" : "file", file);
    form.append("folder", folder);
    form.append("resource_type", resource_type);
    
    const url = isImage ? "/v1/upload/image" : "/v1/media/upload";
    
    return api.post(url, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
      },
    });
  },
};

/**
 * Resolve a media URL that may be:
 *  - an absolute URL (Cloudinary etc.) — returned as-is
 *  - a relative dev-mode path like "/api/uploads/xxx.jpg" — prefixed with BACKEND_URL
 */
const DEFAULT_VIDEO_FALLBACK = 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4';

export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('[')) return DEFAULT_VIDEO_FALLBACK;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Handle local mobile file paths (e.g. Expo ImagePicker cache)
  if (/^file:\/\//i.test(trimmed) || trimmed.includes('/host.exp.exponent/')) {
    return DEFAULT_VIDEO_FALLBACK;
  }

  const host = BACKEND_URL || 'https://api.bizreels.in';
  return `${host}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

// ---- Phase 2 ----
export const feedApi = {
  main: (params = {}) => api.get("/v1/feed/", { params }),
  reels: (params = {}) => api.get("/v1/feed/reels", { params }),
};

export const followApi = {
  follow: (userId) => api.post(`/v1/follows/${userId}`),
  unfollow: (userId) => api.delete(`/v1/follows/${userId}`),
  myFollowing: () => api.get("/v1/follows/me/following"),
};

export const interactionApi = {
  toggleLike: (id) => api.post(`/v1/listings/${id}/like`),
  toggleSave: (id) => api.post(`/v1/listings/${id}/save`),
  save: (id) => api.post(`/v1/listings/${id}/save`),
  unsave: (id) => api.post(`/v1/listings/${id}/unsave`),
  mySaved: () => api.get("/v1/interactions/me/saved"),
  myLiked: () => api.get("/v1/interactions/me/liked"),
};

export const searchApi = {
  search: (params) => api.get("/v1/search/", { params }),
  suggest: (q) => api.get("/v1/search/suggest", { params: { q } }),
};

export const locationApi = {
  reverseGeocode: (lat, lng) => api.post("/v1/utils/reverse-geocode", { lat, lng }),
  pincode: (pincode) => api.post("/v1/utils/pincode-lookup", { pincode }),
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};

export const vendorApi = {
  get: (id) => api.get(`/v1/vendors/${id}`),
  listings: (id) => api.get(`/v1/vendors/${id}/listings`),
};

export const watchApi = {
  watch: (listingId, phone) =>
    api.post(`/v1/listings/${listingId}/watch`, { phone }),
};

export const seoApi = {
  listing: (slug) => api.get(`/v1/seo/listing/${slug}`),
};

// ---- Phase 3 ----
export const requirementApi = {
  create: (body) => api.post("/v1/requirements/", body),
  list: (params = {}) => api.get("/v1/requirements/", { params }),
  get: (id) => api.get(`/v1/requirements/${id}`),
  mine: () => api.get("/v1/requirements/me/posted"),
  proposals: (id) => api.get(`/v1/requirements/${id}/proposals`),
  close: (id) => api.post(`/v1/requirements/${id}/close`),
};

export const proposalApi = {
  create: (body) => api.post("/v1/proposals/", body),
  mySent: () => api.get("/v1/proposals/me/sent"),
  shortlist: (id) => api.post(`/v1/proposals/${id}/shortlist`),
  reject: (id) => api.post(`/v1/proposals/${id}/reject`),
  accept: (id) => api.post(`/v1/proposals/${id}/accept`),
};

export const chatApi = {
  createThread: (body) => api.post("/v1/chat/threads", body),
  myThreads: () => api.get("/v1/chat/threads/me"),
  getThread: (id) => api.get(`/v1/chat/threads/${id}`),
  messages: (id, params = {}) => api.get(`/v1/chat/threads/${id}/messages`, { params }),
  send: (id, body) => api.post(`/v1/chat/threads/${id}/messages`, body),
  read: (id) => api.post(`/v1/chat/threads/${id}/read`),
  archive: (id) => api.post(`/v1/chat/threads/${id}/archive`),
  unreadTotal: () => api.get("/v1/chat/unread-total"),
};

export const dealApi = {
  create: (body) => api.post("/v1/deals/", body),
  mine: (params = {}) => api.get("/v1/deals/me", { params }),
  get: (id) => api.get(`/v1/deals/${id}`),
  counter: (id, body) => api.post(`/v1/deals/${id}/counter`, body),
  accept: (id) => api.post(`/v1/deals/${id}/accept`),
  reject: (id) => api.post(`/v1/deals/${id}/reject`),
  cancel: (id) => api.post(`/v1/deals/${id}/cancel`),
  complete: (id) => api.post(`/v1/deals/${id}/complete`),
};

export const whatsappApi = {
  linkFor: (vendorId, listingId) =>
    api.get(`/v1/utils/whatsapp-link`, { params: { vendor_id: vendorId, listing_id: listingId } }),
};

// ---- Phase 4a ----
export const walletApi = {
  me: () => api.get("/v1/wallet/me"),
  transactions: (params = {}) => api.get("/v1/wallet/me/transactions", { params }),
  topup: (amount_paise) => api.post("/v1/wallet/me/topup", { amount_paise }),
};
export const paymentApi = {
  order: (body) => api.post("/v1/payments/order", body),
  verify: (body) => api.post("/v1/payments/verify", body),
  simulate: (payment_id) => api.post('/v1/payments/dev/simulate-success', { payment_id }),
  mine: () => api.get("/v1/payments/me"),
};
export const subApi = {
  subscribe: (plan) => api.post("/v1/subscriptions/subscribe", { plan }),
  mine: () => api.get("/v1/subscriptions/me"),
  cancel: (id) => api.post(`/v1/subscriptions/${id}/cancel`),
};
export const kycApi = {
  submit: (body) => api.post("/v1/kyc/me/submit", body),
  me: () => api.get("/v1/kyc/me"),
  queue: () => api.get("/v1/admin/kyc"),
  approve: (id) => api.post(`/v1/admin/kyc/${id}/approve`),
  reject: (id, reason) => api.post(`/v1/admin/kyc/${id}/reject`, { reason }),
};
export const reviewApi = {
  create: (body) => api.post("/v1/reviews/", body),
  list: (params) => api.get("/v1/reviews/", { params }),
  update: (id, body) => api.patch(`/v1/reviews/${id}`, body),
  remove: (id) => api.delete(`/v1/reviews/${id}`),
  reply: (id, text) => api.post(`/v1/reviews/${id}/reply`, { text }),
  vendorSummary: (id) => api.get(`/v1/reviews/vendor/${id}/summary`),
};
export const notifApi = {
  list: (params = {}) => api.get("/v1/notifications/me", { params }),
  unreadCount: () => api.get("/v1/notifications/me/unread-count"),
  read: (id) => api.post(`/v1/notifications/${id}/read`),
  readAll: () => api.post("/v1/notifications/me/read-all"),
  dismiss: (id) => api.delete(`/v1/notifications/${id}`),
};
export const trustApi = {
  score: (userId) => api.get(`/v1/users/${userId}/trust-score`),
};

// ---- Phase 4b ----
export const boostApi = {
  boost: (listingId, duration_days, payment_method = "credits") =>
    api.post(`/v1/listings/${listingId}/boost`, { duration_days, payment_method }),
  mine: () => api.get("/v1/listings/vendor/me/boosted"),
};

export const reportApi = {
  create: (body) => api.post("/v1/reports", body),
  adminList: (params = {}) => api.get("/v1/admin/reports", { params }),
  adminResolve: (id, action, note) => api.post(`/v1/admin/reports/${id}/resolve`, { action, note }),
  adminDismiss: (id, reason) => api.post(`/v1/admin/reports/${id}/dismiss`, { reason }),
};

export const adminApi = {
  overview: () => api.get("/v1/admin/analytics/overview"),
  listUsers: (params = {}) => api.get("/v1/admin/users", { params }),
  banUser: (id) => api.post(`/v1/admin/users/${id}/ban`),
  unbanUser: (id) => api.post(`/v1/admin/users/${id}/unban`),
  freezeWallet: (id) => api.post(`/v1/admin/users/${id}/freeze-wallet`),
  unfreezeWallet: (id) => api.post(`/v1/admin/users/${id}/unfreeze-wallet`),
  addRole: (id, role) => api.post(`/v1/admin/users/${id}/add-role`, { role }),
  removeRole: (id, role) => api.post(`/v1/admin/users/${id}/remove-role`, { role }),
  listListings: (params = {}) => api.get("/v1/admin/listings", { params }),
  takedownListing: (id) => api.post(`/v1/admin/listings/${id}/takedown`),
  restoreListing: (id) => api.post(`/v1/admin/listings/${id}/restore`),
};

export const fcmApi = {
  register: (token, platform = "web") => api.post("/v1/users/me/fcm-token", { token, platform }),
  remove: (token) => api.delete(`/v1/users/me/fcm-token/${encodeURIComponent(token)}`),
};

export const reviewHelpfulApi = {
  toggle: (reviewId) => api.post(`/v1/reviews/${reviewId}/helpful`),
};

// ---- Phase 5 ----
export const analyticsApi = {
  overview: (range = "30d") => api.get("/v1/vendor/analytics/overview", { params: { range } }),
  listings: (params = {}) => api.get("/v1/vendor/analytics/listings", { params }),
  timeseries: (range = "30d", metric = "views") => api.get("/v1/vendor/analytics/timeseries", { params: { range, metric } }),
  boostRoi: (listing_id) => api.get("/v1/vendor/analytics/boost-roi", { params: { listing_id } }),
};

export const referralApi = {
  mine: () => api.get("/v1/users/me/referrals/"),
};

export const integrationsApi = {
  get: () => api.get("/v1/admin/settings/integrations"),
  patch: (patch) => api.patch("/v1/admin/settings/integrations", patch),
  test: (integration) => api.post(`/v1/admin/settings/integrations/test?integration=${encodeURIComponent(integration)}`),
};

export const aiApi = {
  generate: (payload) => api.post("/v1/ai/generate-listing-content", payload),
  improve: (payload) => api.post("/v1/ai/improve-description", payload),
  // Phase 7d — Gemini-powered smart features
  title: (payload) => api.post("/v1/ai/generate-title", payload),
  detectCategory: (payload) => api.post("/v1/ai/detect-category", payload),
  parseDemand: (text) => api.post("/v1/ai/parse-demand", { text }),
  matchVendors: (payload) => api.post("/v1/ai/match-vendors", payload),
  suggestPrice: (payload) => api.post("/v1/ai/suggest-price", payload),
  negotiate: (payload) => api.post("/v1/ai/negotiate", payload),
  generateReel: (prompt) => api.post("/v1/ai/generate-reel", { prompt }),
};

export const onboardingApi = {
  checklist: () => api.get("/v1/users/me/onboarding-checklist"),
};

export const trackApi = {
  listing: (listingId, event) => api.post(`/v1/listings/${listingId}/track`, { event }),
};
