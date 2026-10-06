'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { getForwardedCookie } from '@/lib/api/session';
import { createNiche, createNichePost, joinNiche, leaveNiche } from '@/lib/api/niches';
import { uploadMedia } from '@/lib/api/media';

export interface NicheFormState {
  error?: string;
}

export async function createNicheAction(_prev: NicheFormState, formData: FormData): Promise<NicheFormState> {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const visibility = (formData.get('visibility') as 'public' | 'private' | 'restricted') || 'public';
  if (!name) return { error: 'Give your community a name.' };
  if (description.length < 10) return { error: 'Add a description of at least 10 characters.' };

  let niche;
  try {
    niche = await createNiche({ name, description, visibility }, await getForwardedCookie());
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not create the community. Try again.' };
  }

  revalidatePath('/app/community/niches');
  redirect(`/app/community/niches/${niche.id}`);
}

export async function createNichePostAction(nicheId: string, _prev: NicheFormState, formData: FormData): Promise<NicheFormState> {
  const caption = String(formData.get('caption') ?? '').trim();
  const image = formData.get('image');
  const hasImage = image instanceof File && image.size > 0;
  if (!caption && !hasImage) return { error: 'Write something or add a photo.' };

  const cookie = await getForwardedCookie();
  const mediaIds: number[] = [];
  if (hasImage) {
    try {
      const fd = new FormData();
      fd.append('file', image);
      const media = await uploadMedia(fd, cookie);
      mediaIds.push(media.id);
    } catch {
      return { error: 'Could not upload that photo. Try a different one.' };
    }
  }

  try {
    await createNichePost(nicheId, { caption: caption || undefined, media_ids: mediaIds.length ? mediaIds : undefined }, cookie);
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not post. Try again.' };
  }

  revalidatePath(`/app/community/niches/${nicheId}`);
  return {};
}

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
