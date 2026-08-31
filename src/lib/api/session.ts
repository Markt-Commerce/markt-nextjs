import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from './client';
import type { UserProfile } from '@/lib/types/user';

/**
 * The browser only ever talks to this app's own origin — never to the real
 * API directly. That's deliberate: the real API's session cookie is only
 * reliable as a first-party cookie, so this app relays it.
 *
 * `forwardedCookieHeader()` reads whatever Cookie header the browser sent us
 * and passes it straight through to the real API. `relaySetCookies()` does
 * the reverse after login/register/logout: it takes whatever Set-Cookie the
 * real API sent back and re-issues it as our own first-party cookie.
 *
 * Neither of these needs to know the real API's cookie name — they just
 * relay whatever's there. That's intentional: the exact cookie name still
 * hasn't been confirmed, because confirming it needs a *successful* (200)
 * login and the test backend requires email verification first (login itself
 * works now — it returns 403 "verify your email" for an unverified account).
 * This design doesn't depend on the name, so the rest of the app isn't blocked.
 */

/** The raw Cookie header the browser sent us, to forward as-is to the real API. */
export async function getForwardedCookie(): Promise<string | undefined> {
  const cookie = (await headers()).get('cookie');
  return cookie ?? undefined;
}

export async function relaySetCookies(res: Response): Promise<void> {
  const jar = await cookies();
  for (const raw of res.headers.getSetCookie()) {
    const parsed = parseSetCookie(raw);
    if (!parsed) continue;
    // We deliberately don't trust the upstream Secure/SameSite/Domain
    // attributes: the real API sets those assuming it's serving its own
    // origin (or a mobile app). Once relayed, this is OUR cookie on OUR
    // origin, so we set our own sensible first-party attributes and only
    // keep the upstream name/value/expiry.
    jar.set(parsed.name, parsed.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...(parsed.maxAge !== undefined ? { maxAge: parsed.maxAge } : {}),
      ...(parsed.expires ? { expires: parsed.expires } : {}),
    });
  }
}

function parseSetCookie(raw: string): { name: string; value: string; maxAge?: number; expires?: Date } | null {
  const [nameValue, ...attrs] = raw.split(';').map((p) => p.trim());
  const eq = nameValue.indexOf('=');
  if (eq === -1) return null;

  const result: { name: string; value: string; maxAge?: number; expires?: Date } = {
    name: nameValue.slice(0, eq),
    value: nameValue.slice(eq + 1),
  };

  for (const attr of attrs) {
    const [key, val] = attr.split('=');
    switch (key.toLowerCase()) {
      case 'max-age':
        result.maxAge = Number(val);
        break;
      case 'expires':
        result.expires = new Date(val);
        break;
    }
  }

  return result;
}

/**
 * DEV CONVENIENCE: real login/register work now (the `is_admin` migration
 * that used to 500 every attempt has been applied). But a real account can't
 * sign in until it verifies its email (login returns 403 for unverified
 * users), so this mock-session cookie stays as a quick "skip sign-in" bypass
 * to click through the app without a verified account: `mockLoginAction`
 * (src/app/auth/actions.ts) sets it directly, with no real backend call.
 * Remove this block once there's a verified test account — search the
 * codebase for MOCK_SESSION_COOKIE.
 */
const MOCK_SESSION_COOKIE = 'markt_mock_session';
type MockRole = 'buyer' | 'seller';

function mockUser(role: MockRole): UserProfile {
  const now = new Date().toISOString();
  return {
    id: `mock-${role}`,
    email: `mock.${role}@markt.test`,
    username: `mock_${role}`,
    current_role: role,
    is_buyer: role === 'buyer',
    is_seller: role === 'seller',
    email_verified: true,
    created_at: now,
    updated_at: now,
  };
}

export async function setMockSession(role: MockRole): Promise<void> {
  (await cookies()).set(MOCK_SESSION_COOKIE, role, { httpOnly: true, sameSite: 'lax', path: '/' });
}

/**
 * Current user, or null if not signed in. Memoized per-request (React
 * cache()) so calling this from a layout AND a page in the same request
 * only hits the real API once.
 */
export const getSession = cache(async (): Promise<UserProfile | null> => {
  const mockRole = (await cookies()).get(MOCK_SESSION_COOKIE)?.value;
  if (mockRole === 'buyer' || mockRole === 'seller') return mockUser(mockRole);

  const cookie = await getForwardedCookie();
  if (!cookie) return null;

  try {
    return await apiFetch<UserProfile>('/users/profile', { cookie, cache: 'no-store' });
  } catch (err) {
    // Any failure to resolve the session means we have no usable user —
    // whether that's a 401 (genuinely signed out), a transient 5xx, or the
    // backend being unreachable entirely. Treat all of them as signed-out
    // rather than letting a raw fetch error crash the
    // whole /app subtree: requireSession() then routes to /auth/login, where
    // the demo-session shortcut also lives. A 401 is expected and stays quiet;
    // anything else is logged so it's still visible in the dev console.
    if (!(err instanceof ApiError && err.status === 401)) {
      console.error('[session] could not resolve /users/profile:', err);
    }
    return null;
  }
});

/**
 * Drops every cookie this app is holding. Used on logout — since we don't
 * track the real API's cookie name(s) explicitly (see the note above), and
 * this app doesn't set any cookies of its own beyond the relayed session,
 * clearing the whole jar is equivalent to clearing "the session".
 */
export async function clearSession(): Promise<void> {
  const jar = await cookies();
  for (const c of jar.getAll()) jar.delete(c.name);
}

/** For Server Components/layouts that require a signed-in user. */
export async function requireSession(returnUrl?: string): Promise<UserProfile> {
  const user = await getSession();
  if (!user) {
    redirect(returnUrl ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/auth/login');
  }
  return user;
}
