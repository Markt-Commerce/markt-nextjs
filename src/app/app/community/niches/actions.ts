'use server';

import { revalidatePath } from 'next/cache';
import { getForwardedCookie } from '@/lib/api/session';
import { joinNiche, leaveNiche } from '@/lib/api/niches';

export async function toggleNicheMembershipAction(nicheId: string, currentlyMember: boolean): Promise<{ ok: boolean }> {
  try {
    if (currentlyMember) await leaveNiche(nicheId, await getForwardedCookie());
    else await joinNiche(nicheId, await getForwardedCookie());
  } catch {
    return { ok: false };
  }
  revalidatePath('/app/community/niches');
  revalidatePath(`/app/community/niches/${nicheId}`);
  return { ok: true };
}
