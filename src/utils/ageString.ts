/**
 * Returns a human-readable age string from a Unix epoch ms date of birth.
 * Examples: "3 days", "4 months", "2 years 3 months"
 */
export function computeAge(dob: number): string {
  const now = Date.now();
  const diffMs = now - dob;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
  }

  const diffMonths = Math.floor(diffDays / 30.44);
  if (diffMonths < 24) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'}`;
  }

  const years = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;
  if (remainingMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  return `${years} year${years === 1 ? '' : 's'} ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
}
