import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const ACCESS_KEY = "emergent_access_token";
const REFRESH_KEY = "emergent_refresh_token";
const USER_KEY = "emergent_user";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  set: ({ access_token, refresh_token, user }) => {
    if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const access = tokenStore.getAccess();
  if (access) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${access}`;
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
    const refresh = tokenStore.getRefresh();
    if (!refresh) {
      tokenStore.clear();
      return Promise.reject(error);
    }
    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE}/v1/auth/refresh`, { refresh_token: refresh })
          .then((res) => {
            // Refresh token rotation: server returns new access + refresh pair.
            tokenStore.set({
              access_token: res.data.access_token,
              refresh_token: res.data.refresh_token,
            });
            return res.data.access_token;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newAccess = await refreshPromise;
      config._retry = true;
      config.headers.Authorization = `Bearer ${newAccess}`;
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
  refresh: (refresh_token) => api.post("/v1/auth/refresh", { refresh_token }),
  logout: (refresh_token) => api.post("/v1/auth/logout", { refresh_token }),
};

export const userApi = {
  me: () => api.get("/v1/users/me"),
  update: (payload) => api.patch("/v1/users/me", payload),
  switchRole: (role) => api.post("/v1/users/me/switch-role", { role }),
  addRole: (role) => api.post("/v1/users/me/add-role", { role }),
};

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
    form.append("file", file);
    form.append("folder", folder);
    form.append("resource_type", resource_type);
    return api.post("/v1/media/upload", form, {
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
export function resolveMediaUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${BACKEND_URL}${url}`;
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
  simulate: (payment_id) => api.post(`/v1/payments/dev/simulate-success?payment_id=${payment_id}`),
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

export const onboardingApi = {
  checklist: () => api.get("/v1/users/me/onboarding-checklist"),
};

export const trackApi = {
  listing: (listingId, event) => api.post(`/v1/listings/${listingId}/track`, { event }),
};
