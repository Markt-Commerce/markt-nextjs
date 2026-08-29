'use server';

import { redirect } from 'next/navigation';
import { apiFetch, apiFetchRaw, ApiError } from '@/lib/api/client';
import { relaySetCookies, clearSession, getForwardedCookie, setMockSession } from '@/lib/api/session';

export interface FormState {
  error?: string;
  success?: boolean;
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

  if (!email || !password) return { error: 'Email and password are required.' };

  let res: Response;
  try {
    res = await apiFetchRaw('/users/login', { method: 'POST', body: { email, password } });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return { error: 'Invalid email or password.' };
    return { error: messageFor(err, 'Something went wrong. Please try again.') };
  }

  await relaySetCookies(res);
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
    return { error: messageFor(err, 'Something went wrong. Please try again.') };
  }

  return { success: true };
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

// TEMPORARY — see the note in lib/api/session.ts. Remove once real login works.
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
