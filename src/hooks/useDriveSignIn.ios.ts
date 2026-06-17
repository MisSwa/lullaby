// iOS uses iCloud for backup — Drive sign-in is Android-only.
// This no-op stub prevents expo-auth-session/providers/google from
// loading on iOS (which errors without an iosClientId).
export function useDriveSignIn(): { signIn: () => Promise<void> } {
  return { signIn: async () => {} };
}
