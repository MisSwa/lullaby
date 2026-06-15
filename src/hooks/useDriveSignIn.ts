import { useEffect, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { setAccessToken, getAccessToken } from '@services/driveAuth';

// Required so that the system browser can redirect back to the app after auth
WebBrowser.maybeCompleteAuthSession();

// ─── Setup instructions ───────────────────────────────────────────────────────
//
// Before Drive backup works on Android, you must:
//   1. Create a project in Google Cloud Console (console.cloud.google.com)
//   2. Enable the Google Drive API for that project
//   3. Configure the OAuth consent screen (External, drive.file scope)
//   4. Create an Android OAuth 2.0 client ID
//      - Package name: com.lullaby.app
//      - SHA-1 fingerprint: run `eas credentials` or `keytool` to get this
//   5. Paste the resulting client ID below
//
const ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';

export function useDriveSignIn(): { signIn: () => Promise<void> } {
  const [, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    scopes: ['openid', 'email', 'https://www.googleapis.com/auth/drive.file'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken ?? null;
      if (token) {
        setAccessToken(token);
      }
    } else if (response?.type === 'error') {
      console.error('Drive OAuth error:', response.error);
    }
  }, [response]);

  const signIn = useCallback(async (): Promise<void> => {
    if (getAccessToken()) return; // already authenticated this session
    try {
      await promptAsync();
    } catch (error) {
      console.error('Drive sign-in failed:', error);
    }
  }, [promptAsync]);

  return { signIn };
}
