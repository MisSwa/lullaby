// Module-level access token — in-memory only, never written to SQLite or AsyncStorage.
// This is the sole exception to the no-accounts rule in CLAUDE.md:
// it is a background Drive permission, not a user-facing account.
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string): void {
  _accessToken = token;
  console.log('Drive OAuth: access token stored in memory');
}
