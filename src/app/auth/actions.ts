'use server';

import { redirect } from 'next/navigation';
import { apiFetch, apiFetchRaw, ApiError } from '@/lib/api/client';
import { switchRole } from '@/lib/api/account';
import { relaySetCookies, clearSession, getForwardedCookie, setMockSession } from '@/lib/api/session';

export interface FormState {
  error?: string;
  success?: boolean;
  // Set only when the backend rejects the request because the account's email
  // isn't verified yet — lets the UI offer a "verify your email" link to just
  // those users, rather than showing it to everyone.
  needsVerification?: boolean;
}

/** True when an API error is the backend's "email not verified" rejection. */
function isUnverifiedEmailError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 403 || /verif/i.test(err.message));
}

function messageFor(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  // Surface the status inline so a backend error is visible in the UI
  // itself, not just the terminal running `next dev` (client.ts logs the
  // full body there for every failed call).
  return `${err.message} (${err.status})`;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const returnUrl = String(formData.get('returnUrl') ?? '') || '/app/dashboard';
  // Which context the person chose to sign into (one account holds both roles).
  const chosenRole = formData.get('role') === 'seller' ? 'seller' : 'buyer';

  if (!email || !password) return { error: 'Email and password are required.' };

  let res: Response;
  try {
    res = await apiFetchRaw('/users/login', { method: 'POST', body: { email, password } });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return { error: 'Invalid email or password.' };
    return { error: messageFor(err, 'Something went wrong. Please try again.') };
  }

  await relaySetCookies(res);

  // The login response is the User — use it to honor the buyer/seller switcher.
  const user = (await res.json().catch(() => null)) as
    | { is_buyer?: boolean; is_seller?: boolean; current_role?: string }
    | null;

  if (user && (user.is_buyer !== undefined || user.is_seller !== undefined)) {
    const hasChosen = chosenRole === 'seller' ? !!user.is_seller : !!user.is_buyer;
    if (!hasChosen) {
      // They picked a role this account doesn't have — sign back out and point
      // them at the role they actually do have.
      const actual = user.is_seller ? 'seller' : 'buyer';
      await clearSession();
      return {
        error: `This email is registered as a ${actual} account. Sign in as ${actual}, or add a ${chosenRole} profile in Settings.`,
      };
    }
    // Put them in the right context if they're not already there.
    if (user.current_role && user.current_role !== chosenRole) {
      const sessionCookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
      try {
        await switchRole(sessionCookie || undefined);
      } catch {
        // Non-fatal — they're signed in; the role just won't have flipped.
      }
    }
  }

  redirect(returnUrl);
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const phoneNumber = String(formData.get('phone_number') ?? '').trim();
  const accountType = formData.get('account_type') === 'seller' ? 'seller' : 'buyer';
  const terms = formData.get('terms') === 'on';

  if (!email || !username || !password) return { error: 'Please fill in all required fields.' };
  if (password !== confirmPassword) return { error: 'Passwords do not match.' };
  if (!terms) return { error: 'You must agree to the Terms of Service and Privacy Policy.' };

  const body = {
    email,
    username,
    password,
    ...(phoneNumber ? { phone_number: phoneNumber } : {}),
    account_type: accountType,
    // Full shop/shipping setup is deferred to onboarding (not built yet, same
    // scope decision the mock app made) — these are just enough to satisfy
    // the real API's required fields.
    ...(accountType === 'buyer'
      ? { buyer_data: { buyername: username } }
      : { seller_data: { shop_name: `${username}'s Shop`, description: '', category_ids: [] } }),
  };

  let res: Response;
  try {
    res = await apiFetchRaw('/users/register', { method: 'POST', body });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) return { error: 'That email or username is already taken.' };
    return { error: messageFor(err, 'Something went wrong. Please try again.') };
  }

  await relaySetCookies(res);
  redirect('/app/dashboard');
}

export async function checkUsernameAction(username: string): Promise<{ available: boolean; message?: string }> {
  return apiFetch(`/users/check-username?username=${encodeURIComponent(username)}`, { cache: 'no-store' });
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Email is required.' };

  try {
    await apiFetch('/users/password-reset', { method: 'POST', body: { email } });
  } catch (err) {
    if (isUnverifiedEmailError(err)) {
      return {
        error: 'This email isn’t verified yet. Verify it first, then come back to reset your password.',
        needsVerification: true,
      };
    }
    return { error: messageFor(err, 'Something went wrong. Please try again.') };
  }

  return { success: true };
}

/**
 * Second half of the reset flow: the user pastes the 6-digit code the backend
 * emailed them (`/users/password-reset`) plus a new password, and we confirm it
 * via `/users/password-reset/confirm` ({ email, code, new_password }). Split out
 * from `forgotPasswordAction` so the UI can walk request → confirm as two steps.
 */
export async function resetPasswordAction(email: string, code: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  if (!email || !code || !newPassword) return { ok: false, error: 'Code and a new password are required.' };
  try {
    await apiFetch('/users/password-reset/confirm', {
      method: 'POST',
      body: { email, code, new_password: newPassword },
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) return { ok: false, error: 'That code is invalid or has expired.' };
    return { ok: false, error: messageFor(err, 'Could not reset your password. Please try again.') };
  }
}

export async function verifyEmailAction(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiFetch('/users/email-verification/verify', { method: 'POST', body: { email, verification_code: code } });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFor(err, 'Verification failed.') };
  }
}

export async function resendVerificationAction(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiFetch('/users/email-verification/send', { method: 'POST', body: { email } });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: messageFor(err, 'Could not resend verification email.') };
  }
}

// DEV CONVENIENCE — see the note in lib/api/session.ts. Real login works now;
// this stays as a "skip sign-in" bypass until there's an email-verified test
// account. Remove once that exists (search MOCK_SESSION_COOKIE).
export async function mockLoginAction(formData: FormData): Promise<void> {
  const role = formData.get('role') === 'seller' ? 'seller' : 'buyer';
  await setMockSession(role);
  redirect('/app/dashboard');
}

export async function logoutAction(): Promise<void> {
  try {
    const cookie = await getForwardedCookie();
    if (cookie) await apiFetchRaw('/users/logout', { method: 'POST', cookie });
  } catch {
    // Still log the user out locally even if the real API call fails.
  }
  await clearSession();
  redirect('/auth/login');
}
