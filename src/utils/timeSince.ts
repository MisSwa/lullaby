/**
 * Returns a human-readable "time since" string.
 * - null timestamp → "–"
 * - < 60 seconds ago → "just now"
 * - < 60 minutes → "Xm ago"
 * - otherwise → "Xh Ym ago"
 */
export function timeSince(ts: number | null, now: number): string {
  if (ts === null) return '–';
  const diffSecs = Math.floor((now - ts) / 1000);
  if (diffSecs < 60) return 'just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  return m === 0 ? `${h}h ago` : `${h}h ${m}m ago`;
}
