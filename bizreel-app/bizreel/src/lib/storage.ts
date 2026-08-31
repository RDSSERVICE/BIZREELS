/**
 * Storage layer — expo-secure-store backed.
 *
 * Tokens (accessToken, refreshToken) and Auth User profile are stored in the device's secure enclave
 * (iOS Keychain / Android Keystore) via expo-secure-store.
 *
 * Maintains an in-memory cache warmed on app startup via hydrateTokenCache()
 * so the axios interceptor and AuthContext can read session credentials synchronously.
 */

import * as SecureStore from 'expo-secure-store';

// ---------------------------------------------------------------------------
// In-memory cache (warmed from SecureStore on startup)
// ---------------------------------------------------------------------------
let _tokenCache: Record<string, string> = {};

/**
 * Base64 decoder helper for standard JWT tokens in React Native
 */
function base64Decode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const cleanStr = String(str).replace(/=+$/, '');
  let block = 0;
  for (let idx = 0; idx < cleanStr.length; idx++) {
    const char = cleanStr.charAt(idx);
    const charCode = chars.indexOf(char);
    if (charCode === -1) continue;
    block = idx % 4 ? block * 64 + charCode : charCode;
    if (idx % 4) {
      output += String.fromCharCode(255 & (block >> ((-2 * (idx + 1)) & 6)));
    }
  }
  return output;
}

/**
 * Helper to check whether a JWT access token is expired.
 * Returns true if exp claim is present and <= current timestamp.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false; // If non-standard JWT format, assume valid
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = base64Decode(base64);
    const payload = JSON.parse(jsonPayload);
    if (payload && typeof payload.exp === 'number') {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      // Mark as expired if remaining validity is <= 15 seconds
      return payload.exp <= nowInSeconds + 15;
    }
    return false;
  } catch {
    return false; // Non-fatal parse failure
  }
}

/**
 * Must be called once at app startup (before any API requests).
 * Reads tokens and user profile from SecureStore into memory.
 */
export async function hydrateTokenCache(): Promise<void> {
  try {
    const [token, refresh, userJson] = await Promise.all([
      SecureStore.getItemAsync('accessToken'),
      SecureStore.getItemAsync('refreshToken'),
      SecureStore.getItemAsync('userProfile'),
    ]);
    if (token) _tokenCache['accessToken'] = token;
    if (refresh) _tokenCache['refreshToken'] = refresh;
    if (userJson) _tokenCache['userProfile'] = userJson;
  } catch {
    // Non-fatal — cold start without tokens is handled as unauthenticated
  }
}

/**
 * Synchronous token & profile access for axios interceptors and AuthContext.
 */
export const tokenStore = {
  getItem: (key: string): string | null => _tokenCache[key] ?? null,

  setItem: (key: string, value: string): void => {
    _tokenCache[key] = value;
    // Persist securely in background — no await needed
    SecureStore.setItemAsync(key, value).catch(() => {});
  },

  removeItem: (key: string): void => {
    delete _tokenCache[key];
    SecureStore.deleteItemAsync(key).catch(() => {});
  },

  clearAll: (): void => {
    delete _tokenCache['accessToken'];
    delete _tokenCache['refreshToken'];
    delete _tokenCache['userProfile'];
    Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
      SecureStore.deleteItemAsync('userProfile'),
    ]).catch(() => {});
  },
};
