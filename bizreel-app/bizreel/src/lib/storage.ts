/**
 * Storage layer — expo-secure-store backed.
 *
 * Tokens (accessToken, refreshToken) are stored in the device's secure enclave
 * (iOS Keychain / Android Keystore) via expo-secure-store.
 *
 * Since SecureStore is async, we maintain a small in-memory cache so the
 * axios interceptor can attach the token synchronously on every request.
 * The cache is warmed once on app startup via hydrateTokenCache().
 *
 * For non-sensitive query cache persistence (TanStack Query), AsyncStorage
 * is still used — it is not a security concern to cache API responses there.
 */

import * as SecureStore from 'expo-secure-store';

// ---------------------------------------------------------------------------
// In-memory token cache (warmed from SecureStore on startup)
// ---------------------------------------------------------------------------
let _tokenCache: Record<string, string> = {};

/**
 * Must be called once at app startup (before any API requests).
 * Reads tokens from SecureStore into memory so the axios interceptor
 * can attach them synchronously.
 */
export async function hydrateTokenCache(): Promise<void> {
  try {
    const [token, refresh] = await Promise.all([
      SecureStore.getItemAsync('accessToken'),
      SecureStore.getItemAsync('refreshToken'),
    ]);
    if (token) _tokenCache['accessToken'] = token;
    if (refresh) _tokenCache['refreshToken'] = refresh;
  } catch {
    // Non-fatal — cold start without a token is handled as unauthenticated
  }
}

/**
 * Synchronous token access for the axios interceptor.
 * Async SecureStore persistence happens in the background on writes.
 */
export const tokenStore = {
  getItem: (key: string): string | null => _tokenCache[key] ?? null,

  setItem: (key: string, value: string): void => {
    _tokenCache[key] = value;
    // Persist securely in background — no await needed
    SecureStore.setItemAsync(key, value).catch(() => {
      // SecureStore write failure is non-fatal; token is still in memory
    });
  },

  removeItem: (key: string): void => {
    delete _tokenCache[key];
    SecureStore.deleteItemAsync(key).catch(() => {});
  },
};
