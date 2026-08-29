import 'server-only';
import { apiFetch, apiFetchMultipart } from './client';
import type { Media, MediaList, MediaStats, MediaUploadResponse } from '@/lib/types/media';

export async function listMedia(cookie: string | undefined): Promise<MediaList> {
  return apiFetch<MediaList>('/media/?per_page=50', { cookie, cache: 'no-store' });
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
