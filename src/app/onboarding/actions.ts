'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { getForwardedCookie } from '@/lib/api/session';
import { createBuyerAccount, createSellerAccount } from '@/lib/api/account';
import { updateBuyerProfile, updateSellerProfile } from '@/lib/api/profile';

export interface OnboardingState {
  error?: string;
}

function messageFor(err: unknown, fallback: string): string {
  return err instanceof ApiError ? `${err.message} (${err.status})` : fallback;
}

/**
 * Finish the buyer side of onboarding. Creates the buyer role if the account
 * doesn't have one yet (`choose_role`), or updates the display name if it does
 * (`buyer_profile`) — the "create-if-missing, update-if-present" rule.
 */
export async function completeBuyerAction(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const buyername = String(formData.get('buyername') ?? '').trim();
  const hasBuyer = formData.get('has_buyer') === '1';
  if (!buyername) return { error: 'Choose a display name so sellers know who they’re dealing with.' };

  const cookie = await getForwardedCookie();
  try {
    if (hasBuyer) await updateBuyerProfile({ buyername }, cookie);
    else await createBuyerAccount(buyername, cookie);
  } catch (err) {
    return { error: messageFor(err, 'Could not finish setting up your account. Please try again.') };
  }

  revalidatePath('/app', 'layout');
  redirect('/app/dashboard?welcome=1');
}

/** Finish the seller side of onboarding (create-if-missing, update-if-present). */
export async function completeSellerAction(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const shopName = String(formData.get('shop_name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const hasSeller = formData.get('has_seller') === '1';
  const categoryIds = formData
    .getAll('category_ids')
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!shopName || !description) return { error: 'Your shop needs a name and a short description.' };
  if (!hasSeller && categoryIds.length === 0) return { error: 'Pick at least one category so buyers can find your shop.' };

  const cookie = await getForwardedCookie();
  try {
    if (hasSeller) await updateSellerProfile({ shop_name: shopName, description }, cookie);
    else await createSellerAccount({ shop_name: shopName, description, category_ids: categoryIds }, cookie);
  } catch (err) {
    return { error: messageFor(err, 'Could not finish setting up your shop. Please try again.') };
  }

  revalidatePath('/app', 'layout');
  redirect('/app/dashboard?welcome=1');
}
