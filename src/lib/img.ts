/**
 * The API sometimes stores a bare placeholder like "default.jpg" in
 * `profile_picture_url` instead of a real URL. Rendering that as an <img src>
 * would 404 against our own origin, so treat anything that isn't an absolute
 * http(s) URL as "no image" and let the caller fall back to a local asset.
 */
export function imageOrFallback(url: string | undefined | null, fallback = '/Logo.png'): string {
  if (url && /^https?:\/\//i.test(url)) return url;
  return fallback;
}
