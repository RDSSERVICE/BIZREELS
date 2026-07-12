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
