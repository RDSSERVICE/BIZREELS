import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { tokenStore } from '@/lib/storage';
import { fetchCurrentUser } from './api';

WebBrowser.maybeCompleteAuthSession();

export async function performGoogleAuth(
  setUser: (user: any) => void
): Promise<{ success: boolean; user?: any; message?: string }> {
  try {
    const redirectUrl = Linking.createURL('/auth/callback');
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://bizreels-backend.onrender.com/api/v1';
    const authUrl = `${baseUrl}/auth/app/google?redirect_uri=${encodeURIComponent(redirectUrl)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

    if (result.type === 'success' && result.url) {
      const parsed = Linking.parse(result.url);
      
      if (parsed.queryParams?.error) {
        const errorMsg = String(parsed.queryParams.error);
        return { success: false, message: decodeURIComponent(errorMsg) };
      }

      const accessToken = parsed.queryParams?.accessToken as string;
      const refreshToken = parsed.queryParams?.refreshToken as string;

      if (accessToken && refreshToken) {
        tokenStore.setItem('accessToken', accessToken);
        tokenStore.setItem('refreshToken', refreshToken);

        const fetchedUser = await fetchCurrentUser();
        if (fetchedUser) {
          tokenStore.setItem('userProfile', JSON.stringify(fetchedUser));
          setUser(fetchedUser);
          return { success: true, user: fetchedUser };
        }
      }
      return { success: false, message: 'Failed to retrieve session tokens from Google login.' };
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: false, message: 'Google sign-in was cancelled.' };
    }

    return { success: false, message: 'Google sign-in session completed without authentication tokens.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to complete Google authentication.' };
  }
}
