import 'server-only';
import { apiFetch } from './client';
import type { BuyerRequest, BuyerRequestSearchResult } from '@/lib/types/request';

export interface RequestListFilters {
  status?: 'OPEN' | 'FULFILLED' | 'CLOSED' | 'EXPIRED';
  search?: string;
  page?: number;
  perPage?: number;
}

export async function listRequests(filters: RequestListFilters, cookie: string | undefined): Promise<BuyerRequestSearchResult> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('per_page', String(filters.perPage));

  return apiFetch<BuyerRequestSearchResult>(`/requests/?${params.toString()}`, { cookie, cache: 'no-store' });
}

export async function listMyRequests(cookie: string | undefined): Promise<BuyerRequestSearchResult> {
  return apiFetch<BuyerRequestSearchResult>('/requests/my-requests', { cookie, cache: 'no-store' });
}

export async function getRequest(id: string, cookie: string | undefined): Promise<BuyerRequest> {
  return apiFetch<BuyerRequest>(`/requests/${encodeURIComponent(id)}`, { cookie, cache: 'no-store' });
}

export async function createRequest(
  body: { title: string; description: string; budget?: number; expires_at?: string },
  cookie: string | undefined
): Promise<BuyerRequest> {
  return apiFetch<BuyerRequest>('/requests/', { method: 'POST', cookie, body });
}

export async function upvoteRequest(id: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/requests/${encodeURIComponent(id)}/upvote`, { method: 'POST', cookie });
}

export async function createOffer(
  requestId: string,
  body: { price: number; message?: string },
  cookie: string | undefined
): Promise<void> {
  await apiFetch(`/requests/${encodeURIComponent(requestId)}/offers`, { method: 'POST', cookie, body });
}

export async function acceptOffer(offerId: number, cookie: string | undefined): Promise<void> {
  await apiFetch(`/requests/offers/${offerId}/accept`, { method: 'POST', cookie });
}

export async function rejectOffer(offerId: number, cookie: string | undefined): Promise<void> {
  await apiFetch(`/requests/offers/${offerId}/reject`, { method: 'POST', cookie });
}

export async function withdrawOffer(offerId: number, cookie: string | undefined): Promise<void> {
  await apiFetch(`/requests/offers/${offerId}/withdraw`, { method: 'POST', cookie });
}
