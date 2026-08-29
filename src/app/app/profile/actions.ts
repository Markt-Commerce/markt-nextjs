'use server';

import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { updateBuyerProfile, updateProfile, updateSellerProfile, uploadProfilePicture } from '@/lib/api/profile';
import { getForwardedCookie } from '@/lib/api/session';

export interface ProfileFormState {
  error?: string;
  success?: boolean;
}

export async function updateProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const cookie = await getForwardedCookie();
  const phoneNumber = String(formData.get('phone_number') ?? '').trim();
  const accountType = String(formData.get('account_type') ?? '');

  try {
    await updateProfile({ phone_number: phoneNumber || undefined }, cookie);

    if (accountType === 'buyer') {
      const buyername = String(formData.get('buyername') ?? '').trim();
      if (buyername) await updateBuyerProfile({ buyername }, cookie);
    } else if (accountType === 'seller') {
      const shopName = String(formData.get('shop_name') ?? '').trim();
      const description = String(formData.get('description') ?? '').trim();
      if (shopName || description) {
        await updateSellerProfile(
          { ...(shopName ? { shop_name: shopName } : {}), ...(description ? { description } : {}) },
          cookie
        );
      }
    }
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not save profile.' };
  }

  revalidatePath('/app/profile');
  revalidatePath('/app', 'layout');
  return { success: true };
}

export async function uploadProfilePictureAction(formData: FormData): Promise<{ error?: string }> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image first.' };

  try {
    await uploadProfilePicture(formData, await getForwardedCookie());
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Upload failed.' };
  }

  revalidatePath('/app/profile');
  revalidatePath('/app', 'layout');
  return {};
}
