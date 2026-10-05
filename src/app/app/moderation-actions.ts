'use server';

import { revalidatePath } from 'next/cache';
import { getForwardedCookie } from '@/lib/api/session';
import { blockUser, reportContent, unblockUser } from '@/lib/api/moderation';
import type { ReportContentType, ReportReason } from '@/lib/types/moderation';

export async function reportContentAction(
  contentId: string,
  contentType: ReportContentType,
  reason: ReportReason,
  details: string
): Promise<{ ok: boolean; error?: string }> {
  if (!reason) return { ok: false, error: 'Pick a reason.' };
  try {
    await reportContent({ content_id: contentId, content_type: contentType, reason, details: details || undefined }, await getForwardedCookie());
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not submit that report. Please try again.' };
  }
}

export async function blockUserAction(userId: string): Promise<{ ok: boolean }> {
  try {
    await blockUser(userId, await getForwardedCookie());
  } catch {
    return { ok: false };
  }
  revalidatePath('/app/community/social-feed');
  revalidatePath('/app/settings');
  return { ok: true };
}

export async function unblockUserAction(userId: string): Promise<{ ok: boolean }> {
  try {
    await unblockUser(userId, await getForwardedCookie());
  } catch {
    return { ok: false };
  }
  revalidatePath('/app/settings');
  return { ok: true };
}
