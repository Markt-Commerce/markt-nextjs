'use server';

import { apiFetchRaw, ApiError } from '@/lib/api/client';
import { apiFetch } from '@/lib/api/client';
import { relaySetCookies } from '@/lib/api/session';

export interface RegistrationPayload {
  email: string;
  username: string;
  password: string;
  phone_number?: string;
  account_type: 'buyer' | 'seller';
}

export interface StepResult {
  ok: boolean;
  error?: string;
}

/**
 * Single registration mutation, fired at the end of step 2. Creates the
 * account (which also logs the user in via the relayed session cookie),
 * then kicks off the email verification code so step 3 has something to
 * verify. Deliberately does NOT redirect — the client wizard controls when
 * to advance.
 */
export async function submitRegistrationAction(payload: RegistrationPayload): Promise<StepResult> {
  const { email, username, password, phone_number, account_type } = payload;

  if (!email || !username || !password) return { ok: false, error: 'Please fill in all required fields.' };

  const body = {
    email,
    username,
    password,
    ...(phone_number ? { phone_number } : {}),
    account_type,
    // Enough to satisfy the API's required sub-object; full shop/shipping
    // setup happens later in the app, not at sign-up.
    ...(account_type === 'buyer'
      ? { buyer_data: { buyername: username } }
      : { seller_data: { shop_name: `${username}'s Shop`, description: '', category_ids: [] } }),
  };

  try {
    const res = await apiFetchRaw('/users/register', { method: 'POST', body });
    await relaySetCookies(res);
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) return { ok: false, error: 'That email or username is already taken.' };
    return { ok: false, error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Something went wrong. Please try again.' };
  }

  // Best-effort — if the code send fails, the verify step still offers a
  // resend, so this shouldn't block advancing.
  try {
    await apiFetch('/users/email-verification/send', { method: 'POST', body: { email } });
  } catch {
    // ignore
  }

  return { ok: true };
}
