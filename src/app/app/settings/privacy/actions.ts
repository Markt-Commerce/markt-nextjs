'use server';

import { revalidatePath } from 'next/cache';
import { updateUserSettings } from '@/lib/api/settings';
import { getForwardedCookie } from '@/lib/api/session';

export async function updatePrivacySettingAction(key: string, value: unknown): Promise<{ error?: string }> {
  try {
    await updateUserSettings({ [key]: value }, await getForwardedCookie());
  } catch {
    return { error: 'Could not save. Try again.' };
  }
  revalidatePath('/app/settings/privacy');
  return {};
}
