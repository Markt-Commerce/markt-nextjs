'use server';

import { revalidatePath } from 'next/cache';
import { deletePost, setPostStatus } from '@/lib/api/social';
import { getForwardedCookie } from '@/lib/api/session';
import type { PostStatusAction } from '@/lib/types/post';

export interface ManageState {
  error?: string;
}

/** Publish / archive / unarchive a post. */
export async function changePostStatusAction(postId: string, action: PostStatusAction): Promise<ManageState> {
  try {
    await setPostStatus(postId, action, await getForwardedCookie());
  } catch {
    return { error: 'Could not update that post. Try again.' };
  }
  revalidatePath('/app/community/my-posts');
  revalidatePath('/app/community/social-feed');
  return {};
}

/** Permanently delete a post. */
export async function deletePostAction(postId: string): Promise<ManageState> {
  try {
    await deletePost(postId, await getForwardedCookie());
  } catch {
    return { error: 'Could not delete that post. Try again.' };
  }
  revalidatePath('/app/community/my-posts');
  revalidatePath('/app/community/social-feed');
  return {};
}
