// This file exists solely for TypeScript module resolution.
// Metro bundler resolves useDriveSignIn.ios.ts / useDriveSignIn.android.ts at runtime.
export function useDriveSignIn(): { signIn: () => Promise<void> } {
  return { signIn: async () => {} };
}
