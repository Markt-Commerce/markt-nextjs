import 'server-only';
import { apiFetch, apiFetchMultipart } from './client';
import type { Media, MediaList, MediaStats, MediaUploadResponse } from '@/lib/types/media';

/**
 * List media. `GET /media/` is NOT scoped to the caller by default (it can
 * return every user's uploads), so we always pass the owner's `user_id` to
 * scope it, and callers should still filter defensively by `user_id`.
 */
export async function listMedia(cookie: string | undefined, userId?: string): Promise<MediaList> {
  const params = new URLSearchParams({ per_page: '50' });
  if (userId) params.set('user_id', userId);
  return apiFetch<MediaList>(`/media/?${params.toString()}`, { cookie, cache: 'no-store' });
}

export async function getMediaStats(cookie: string | undefined): Promise<MediaStats> {
  return apiFetch<MediaStats>('/media/stats', { cookie, cache: 'no-store' });
}

export async function uploadMedia(formData: FormData, cookie: string | undefined): Promise<Media> {
  const res = await apiFetchMultipart<MediaUploadResponse>('/media/upload', formData, cookie);
  return res.media;
}

export async function deleteMediaItem(id: number, cookie: string | undefined): Promise<void> {
  await apiFetch(`/media/${id}`, { method: 'DELETE', cookie });
}
