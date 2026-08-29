import 'server-only';
import { apiFetch } from './client';
import type { AnalyticsOverview, StartCardsResponse } from '@/lib/types/seller';

export async function getStartCards(cookie: string | undefined): Promise<StartCardsResponse> {
  return apiFetch<StartCardsResponse>('/users/sellers/start-cards', { cookie, cache: 'no-store' });
}

export async function getAnalyticsOverview(cookie: string | undefined): Promise<AnalyticsOverview> {
  return apiFetch<AnalyticsOverview>('/users/sellers/analytics/overview', { cookie, cache: 'no-store' });
}
