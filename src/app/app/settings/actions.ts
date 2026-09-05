'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import {
  createBuyerAccount,
  createSellerAccount,
  deleteAccount,
  getAccountDeletionPreview,
  switchRole,
  updateAddress,
} from '@/lib/api/account';
import { updateUserSettings } from '@/lib/api/settings';
import { clearSession, getForwardedCookie } from '@/lib/api/session';

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

export async function updateAddressAction(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const cookie = await getForwardedCookie();
  const body = {
    street: String(formData.get('street') ?? ''),
    house_number: String(formData.get('house_number') ?? ''),
    city: String(formData.get('city') ?? ''),
    state: String(formData.get('state') ?? ''),
    postal_code: String(formData.get('postal_code') ?? ''),
    country: String(formData.get('country') ?? ''),
  };

  try {
    await updateAddress(body, cookie);
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not save address.' };
  }

  revalidatePath('/app/settings');
  return { success: true };
}

export async function switchRoleAction(): Promise<void> {
  try {
    await switchRole(await getForwardedCookie());
  } catch {
    // Surfaced implicitly — the role badge just won't change.
  }
  revalidatePath('/app', 'layout');
  redirect('/app/dashboard');
}

export async function enableBuyerAction(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const buyername = String(formData.get('buyername') ?? '').trim();
  if (!buyername) return { error: 'Enter a display name.' };

  try {
    await createBuyerAccount(buyername, await getForwardedCookie());
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not enable buyer account.' };
  }

  revalidatePath('/app/settings');
  revalidatePath('/app', 'layout');
  return { success: true };
}

/**
 * Save notification preferences into the freeform /users/settings blob under
 * `notification_preferences`. Works today; when the backend adds the dedicated
 * email pipeline (see docs/backend/email-notifications-spec.md) it can read the
 * same shape.
 */
export async function saveNotificationPrefsAction(prefs: Record<string, unknown>): Promise<{ error?: string }> {
  try {
    await updateUserSettings({ notification_preferences: prefs }, await getForwardedCookie());
  } catch {
    return { error: 'Could not save. Try again.' };
  }
  revalidatePath('/app/settings');
  return {};
}

export async function deleteAccountAction(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const confirm = String(formData.get('confirm') ?? '').trim().toUpperCase();
  if (confirm !== 'DELETE') return { error: 'Type DELETE to confirm.' };

  const cookie = await getForwardedCookie();
  try {
    // Check first so we can show why deletion is blocked (e.g. open orders)
    // instead of a bare failure.
    const preview = await getAccountDeletionPreview(cookie);
    if (!preview.can_delete) {
      const reason = preview.blockers?.map((b) => b.message).filter(Boolean).join(' ');
      return { error: reason || 'Your account can’t be deleted yet. Resolve any open orders or balances first.' };
    }
    await deleteAccount(cookie);
    await clearSession();
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not delete your account.' };
  }

  // Account gone and session cleared — send them to the public marketplace.
  redirect('/');
}

export async function enableSellerAction(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const shopName = String(formData.get('shop_name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  if (!shopName || !description) return { error: 'Shop name and description are required.' };

  try {
    await createSellerAccount({ shop_name: shopName, description, category_ids: [] }, await getForwardedCookie());
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not enable seller account.' };
  }

  revalidatePath('/app/settings');
  revalidatePath('/app', 'layout');
  return { success: true };
}
