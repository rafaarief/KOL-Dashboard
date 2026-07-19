/** Dedup key for creators discovered through multiple keywords — see section 18.9 of the PRD. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/^@/, "");
}

export function canonicalizeProfileUrl(profileUrl: string): string {
  try {
    const url = new URL(profileUrl);
    url.search = "";
    url.hash = "";
    return url.origin.replace(/^https?:\/\//, "").toLowerCase() + url.pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return profileUrl.trim().toLowerCase();
  }
}

export function canonicalizeVideoUrl(videoUrl: string): string {
  return canonicalizeProfileUrl(videoUrl);
}
