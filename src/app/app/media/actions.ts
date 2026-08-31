'use server';

import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { deleteMediaItem, uploadMedia } from '@/lib/api/media';
import { attachMediaToProduct, detachProductImage } from '@/lib/api/products';
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

export interface AttachState {
  error?: string;
}

/** Attach a library image to one of the seller's products. */
export async function attachMediaAction(productId: string, mediaId: number): Promise<AttachState> {
  try {
    await attachMediaToProduct(productId, mediaId, await getForwardedCookie());
  } catch (err) {
    return { error: err instanceof ApiError ? `Couldn't attach (${err.status})` : "Couldn't attach that image." };
  }
  revalidatePath('/app/media');
  return {};
}

/** Remove a library image from a product (the media itself stays). */
export async function detachMediaAction(productId: string, imageId: number): Promise<AttachState> {
  try {
    await detachProductImage(productId, imageId, await getForwardedCookie());
  } catch (err) {
    return { error: err instanceof ApiError ? `Couldn't detach (${err.status})` : "Couldn't detach that image." };
  }
  revalidatePath('/app/media');
  return {};
}
