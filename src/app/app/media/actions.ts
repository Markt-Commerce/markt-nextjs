'use server';

import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { deleteMediaItem, uploadMedia } from '@/lib/api/media';
import {
  attachMediaToProduct,
  createProduct,
  deleteProduct,
  detachProductImage,
  updateProduct,
  type ProductWrite,
} from '@/lib/api/products';
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

export interface SaveProductResult {
  error?: string;
  productId?: string;
}

/** Create a new product, or update an existing one when `id` is given. */
export async function saveProductAction(
  input: ProductWrite & { id?: string }
): Promise<SaveProductResult> {
  const name = input.name?.trim();
  if (!name) return { error: 'Product name is required.' };
  if (!(input.price >= 0)) return { error: 'Enter a valid price.' };

  const body: ProductWrite = {
    name,
    price: input.price,
    stock: input.stock,
    description: input.description?.trim() || undefined,
    compare_at_price: input.compare_at_price || undefined,
    category_ids: input.category_ids?.length ? input.category_ids : undefined,
  };

  try {
    const cookie = await getForwardedCookie();
    const product = input.id ? await updateProduct(input.id, body, cookie) : await createProduct(body, cookie);
    revalidatePath('/app/media');
    return { productId: product.id };
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not save the product.' };
  }
}

export async function deleteProductAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteProduct(id, await getForwardedCookie());
  } catch (err) {
    return { error: err instanceof ApiError ? `Couldn't delete (${err.status})` : "Couldn't delete that product." };
  }
  revalidatePath('/app/media');
  return {};
}
