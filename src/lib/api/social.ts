import 'server-only';
import { apiFetch } from './client';
import type { PostComments, PostDetail, PostDetailSearchResult, PostList, PostStatusAction, Story } from '@/lib/types/post';

export async function getFeed(cookie: string | undefined): Promise<PostDetailSearchResult> {
  return apiFetch<PostDetailSearchResult>('/socials/feed?per_page=20', { cookie, cache: 'no-store' });
}

/**
 * Latest posts across Markt. Unlike `/socials/feed` (personalized), this list
 * endpoint fully expands each post's `social_media[].media`, so images render
 * in the feed — the personalized feed only sends `media_id` without the URL,
 * which is why feed images used to only appear after opening a post. This is
 * the community's default "Latest" tab.
 */
export async function getLatestPosts(cookie: string | undefined, page = 1): Promise<PostDetailSearchResult> {
  return apiFetch<PostDetailSearchResult>(`/socials/posts?per_page=20&page=${page}`, { cookie, cache: 'no-store' });
}

/** Posts from people the current user follows. */
export async function getFollowingFeed(cookie: string | undefined): Promise<PostDetailSearchResult> {
  return apiFetch<PostDetailSearchResult>('/socials/feed/following?per_page=20', { cookie, cache: 'no-store' });
}

export async function getStories(cookie: string | undefined): Promise<Story[]> {
  return apiFetch<Story[]>('/socials/stories', { cookie, cache: 'no-store' });
}

export async function getPost(id: string, cookie: string | undefined): Promise<PostDetail> {
  return apiFetch<PostDetail>(`/socials/posts/${encodeURIComponent(id)}`, { cookie, cache: 'no-store' });
}

export async function getPostComments(id: string, cookie: string | undefined): Promise<PostComments> {
  return apiFetch<PostComments>(`/socials/posts/${encodeURIComponent(id)}/comments?per_page=50`, { cookie, cache: 'no-store' });
}

export async function createPost(
  caption: string,
  mediaIds: number[],
  productIds: string[],
  cookie: string | undefined
): Promise<PostDetail> {
  return apiFetch<PostDetail>('/socials/posts', {
    method: 'POST',
    cookie,
    body: {
      caption,
      status: 'active',
      ...(mediaIds.length ? { media_ids: mediaIds } : {}),
      ...(productIds.length ? { products: productIds.map((product_id) => ({ product_id })) } : {}),
    },
  });
}

/** A user's own published posts. */
export async function getUserPosts(userId: string, cookie: string | undefined): Promise<PostList> {
  return apiFetch<PostList>(`/socials/user/${encodeURIComponent(userId)}/posts?per_page=50`, { cookie, cache: 'no-store' });
}

/** The current user's draft posts (not yet published). */
export async function getMyDrafts(cookie: string | undefined): Promise<PostDetail[]> {
  return apiFetch<PostDetail[]>('/socials/user/posts/drafts?per_page=50', { cookie, cache: 'no-store' });
}

/** The current user's archived posts. */
export async function getMyArchived(cookie: string | undefined): Promise<PostDetail[]> {
  return apiFetch<PostDetail[]>('/socials/user/posts/archived?per_page=50', { cookie, cache: 'no-store' });
}

/** Publish / archive / unarchive / delete a post via its lifecycle action. */
export async function setPostStatus(postId: string, action: PostStatusAction, cookie: string | undefined): Promise<void> {
  await apiFetch(`/socials/posts/${encodeURIComponent(postId)}/status`, { method: 'PUT', cookie, body: { action } });
}

/** Permanently remove a post. */
export async function deletePost(postId: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/socials/posts/${encodeURIComponent(postId)}`, { method: 'DELETE', cookie });
}

export async function togglePostLike(id: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/socials/posts/${encodeURIComponent(id)}/like`, { method: 'POST', cookie });
}

export async function addComment(id: string, content: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/socials/posts/${encodeURIComponent(id)}/comments`, { method: 'POST', cookie, body: { content } });
}

export async function followUser(userId: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/socials/follow/${encodeURIComponent(userId)}`, { method: 'POST', cookie });
}

export async function unfollowUser(userId: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/socials/follow/${encodeURIComponent(userId)}`, { method: 'DELETE', cookie });
}
