'use server';

import { revalidatePath } from 'next/cache';
import { markNotificationsRead } from '@/lib/api/notifications';
import { getForwardedCookie } from '@/lib/api/session';

export async function markReadAction(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    await markNotificationsRead(ids, await getForwardedCookie());
  } catch {
    // Best-effort — the user already sees it as read client-side either way.
  }
  revalidatePath('/app/notifications');
  revalidatePath('/app', 'layout');
}
