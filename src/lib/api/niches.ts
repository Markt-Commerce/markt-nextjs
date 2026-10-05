import 'server-only';
import { apiFetch } from './client';
import type { CanPost, Niche, NicheList, NicheMembershipList, NichePostList } from '@/lib/types/niche';

/** Discover communities. */
export async function listNiches(cookie: string | undefined, opts: { search?: string; page?: number } = {}): Promise<NicheList> {
  const params = new URLSearchParams({ per_page: '30' });
  if (opts.search) params.set('search', opts.search);
  if (opts.page) params.set('page', String(opts.page));
  return apiFetch<NicheList>(`/socials/niches?${params.toString()}`, { cookie, cache: 'no-store' });
}

/** Communities the current user belongs to. */
export async function listMyNiches(cookie: string | undefined): Promise<NicheMembershipList> {
  return apiFetch<NicheMembershipList>('/socials/my-niches?per_page=50', { cookie, cache: 'no-store' });
}

export async function getNiche(id: string, cookie: string | undefined): Promise<Niche> {
  return apiFetch<Niche>(`/socials/niches/${encodeURIComponent(id)}`, { cookie, cache: 'no-store' });
}

export async function getNichePosts(id: string, cookie: string | undefined): Promise<NichePostList> {
  return apiFetch<NichePostList>(`/socials/niches/${encodeURIComponent(id)}/posts?per_page=20`, { cookie, cache: 'no-store' });
}

export async function canPostInNiche(id: string, cookie: string | undefined): Promise<CanPost> {
  return apiFetch<CanPost>(`/socials/niches/${encodeURIComponent(id)}/can-post`, { cookie, cache: 'no-store' });
}

export async function joinNiche(id: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/socials/niches/${encodeURIComponent(id)}/join`, { method: 'POST', cookie });
}

export async function leaveNiche(id: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/socials/niches/${encodeURIComponent(id)}/leave`, { method: 'POST', cookie });
}
