'use server';

import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { deleteMediaItem, uploadMedia } from '@/lib/api/media';
import { getForwardedCookie } from '@/lib/api/session';

export interface UploadState {
  error?: string;
}

export async function uploadMediaAction(formData: FormData): Promise<UploadState> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a file first.' };

  try {
    await uploadMedia(formData, await getForwardedCookie());
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Upload failed.' };
  }

  revalidatePath('/app/media');
  return {};
}

export async function deleteMediaAction(id: number): Promise<void> {
  try {
    await deleteMediaItem(id, await getForwardedCookie());
  } catch {
    // Best-effort.
  }
  revalidatePath('/app/media');
}
