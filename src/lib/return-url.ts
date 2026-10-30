/**
 * A `returnUrl` from the query string, accepted only if it's a path inside
 * this app. Anything else — another origin, `//evil.example`, `javascript:`
 * — falls back, so sign-in can't be used to bounce someone off-site.
 */
export function safeReturnUrl(value: string | null | undefined, fallback = '/app/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}
