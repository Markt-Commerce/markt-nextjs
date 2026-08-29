'use server';

import { revalidatePath } from 'next/cache';
import { addComment, createPost, followUser, togglePostLike, unfollowUser } from '@/lib/api/social';
import { uploadMedia } from '@/lib/api/media';
import { getForwardedCookie } from '@/lib/api/session';

export interface PostFormState {
  error?: string;
}

export async function createPostAction(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const caption = String(formData.get('caption') ?? '').trim();
  const image = formData.get('image');
  const hasImage = image instanceof File && image.size > 0;
  const productId = String(formData.get('product_id') ?? '').trim();
  const productIds = productId ? [productId] : [];

  // A post needs at least one of: words, a photo, or a tagged product.
  if (!caption && !hasImage && productIds.length === 0) {
    return { error: 'Add a caption, a photo, or tag a product first.' };
  }

  const cookie = await getForwardedCookie();
  const mediaIds: number[] = [];

  if (hasImage) {
    try {
      const media = new FormData();
      media.append('file', image);
      const uploaded = await uploadMedia(media, cookie);
      mediaIds.push(uploaded.id);
    } catch {
      return { error: 'Could not upload that photo. Try a different one.' };
    }
  }

  try {
    await createPost(caption, mediaIds, productIds, cookie);
  } catch {
    return { error: 'Could not post. Try again.' };
  }

  revalidatePath('/app/community/social-feed');
  return {};
}

export async function toggleLikeAction(postId: string): Promise<void> {
  try {
    await togglePostLike(postId, await getForwardedCookie());
  } catch {
    // Best-effort — button already reflects the toggle optimistically.
  }
  revalidatePath('/app/community/social-feed');
  revalidatePath(`/app/community/post/${postId}`);
}

export interface CommentFormState {
  error?: string;
}

export async function addCommentAction(postId: string, _prev: CommentFormState, formData: FormData): Promise<CommentFormState> {
  const content = String(formData.get('content') ?? '').trim();
  if (!content) return { error: 'Write a comment first.' };

  try {
    await addComment(postId, content, await getForwardedCookie());
  } catch {
    return { error: 'Could not post comment. Try again.' };
  }

  revalidatePath(`/app/community/post/${postId}`);
  return {};
}

export async function toggleFollowAction(userId: string, currentlyFollowing: boolean): Promise<void> {
  try {
    if (currentlyFollowing) await unfollowUser(userId, await getForwardedCookie());
    else await followUser(userId, await getForwardedCookie());
  } catch {
    // Best-effort — button already reflects the toggle optimistically.
  }
}
