import 'server-only';
import { apiFetch } from './client';
import type { PostComments, PostDetail, PostDetailSearchResult, Story } from '@/lib/types/post';

export async function getFeed(cookie: string | undefined): Promise<PostDetailSearchResult> {
  return apiFetch<PostDetailSearchResult>('/socials/feed?per_page=20', { cookie, cache: 'no-store' });
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
