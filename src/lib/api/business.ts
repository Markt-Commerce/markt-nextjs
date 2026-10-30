import 'server-only';
import { cache } from 'react';
import { apiFetch } from './client';
import type {
  BusinessConfig,
  BusinessListing,
  BusinessListingInput,
  BusinessListingResult,
  BusinessProfile,
  BusinessProfileInput,
  MyBusiness,
  MySubscription,
  Page,
  SubscriptionPlan,
} from '@/lib/types/business';

/**
 * What the app falls back to when the config endpoint can't be reached:
 * business on, subscriptions off — the backend's own defaults. The lookup
 * lists are empty, so forms that need them show a retry message rather than
 * guessing at values the backend may reject.
 */
const FALLBACK_CONFIG: BusinessConfig = {
  features: {
    enabled: true,
    registration_enabled: true,
    discovery_enabled: true,
    procurement_enabled: true,
    subscriptions_enabled: false,
    verification_enabled: false,
  },
  business_types: [],
  industries: [],
  units: [],
};

/**
 * The single source for every business and subscription visibility decision
 * in this app. Never hardcode a flag client-side — read it from here.
 * Memoized per request, like getSession.
 */
export const getBusinessConfig = cache(async (): Promise<BusinessConfig> => {
  try {
    return await apiFetch<BusinessConfig>('/business/config', { cache: 'no-store' });
  } catch {
    return FALLBACK_CONFIG;
  }
});

export async function getMyBusiness(cookie: string | undefined): Promise<MyBusiness> {
  return apiFetch<MyBusiness>('/business/me', { cookie, cache: 'no-store' });
}

export async function saveBusinessProfile(body: BusinessProfileInput, cookie: string | undefined): Promise<MyBusiness> {
  return apiFetch<MyBusiness>('/business/me', { method: 'PUT', cookie, body });
}

export async function disableBusiness(cookie: string | undefined): Promise<MyBusiness> {
  return apiFetch<MyBusiness>('/business/me', { method: 'DELETE', cookie });
}

export interface DiscoverFilters {
  search?: string;
  businessType?: string;
  industry?: string;
  state?: string;
  side?: 'buys' | 'sells';
  page?: number;
}

export async function discoverBusinesses(filters: DiscoverFilters, cookie: string | undefined): Promise<Page<BusinessProfile>> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.businessType) params.set('business_type', filters.businessType);
  if (filters.industry) params.set('industry', filters.industry);
  if (filters.state) params.set('state', filters.state);
  if (filters.side) params.set('side', filters.side);
  if (filters.page) params.set('page', String(filters.page));
  return apiFetch<Page<BusinessProfile>>(`/business/discover?${params.toString()}`, { cookie, cache: 'no-store' });
}

export async function getBusinessProfile(userId: string, cookie: string | undefined): Promise<BusinessProfile> {
  return apiFetch<BusinessProfile>(`/business/${encodeURIComponent(userId)}`, { cookie, cache: 'no-store' });
}

export interface ListingFilters {
  search?: string;
  unit?: string;
  state?: string;
  minAvailable?: number;
  maxMinOrder?: number;
  sellerUserId?: string;
  page?: number;
  perPage?: number;
}

export async function searchListings(filters: ListingFilters, cookie: string | undefined): Promise<Page<BusinessListingResult>> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.unit) params.set('unit', filters.unit);
  if (filters.state) params.set('state', filters.state);
  if (filters.minAvailable !== undefined) params.set('min_available', String(filters.minAvailable));
  if (filters.maxMinOrder !== undefined) params.set('max_min_order', String(filters.maxMinOrder));
  if (filters.sellerUserId) params.set('seller_user_id', filters.sellerUserId);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('per_page', String(filters.perPage));
  return apiFetch<Page<BusinessListingResult>>(`/business/listings?${params.toString()}`, { cookie, cache: 'no-store' });
}

export async function getListing(productId: string, cookie: string | undefined): Promise<BusinessListing> {
  return apiFetch<BusinessListing>(`/business/listings/${encodeURIComponent(productId)}`, { cookie, cache: 'no-store' });
}

export async function saveListing(productId: string, body: BusinessListingInput, cookie: string | undefined): Promise<BusinessListing> {
  return apiFetch<BusinessListing>(`/business/listings/${encodeURIComponent(productId)}`, { method: 'PUT', cookie, body });
}

export async function removeListing(productId: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/business/listings/${encodeURIComponent(productId)}`, { method: 'DELETE', cookie });
}

// Subscriptions. Both 404 while subscriptions are disabled; callers check
// config.features.subscriptions_enabled first and never render this UI
// otherwise.
export async function listSubscriptionPlans(cookie: string | undefined): Promise<SubscriptionPlan[]> {
  return apiFetch<SubscriptionPlan[]>('/business/subscriptions/plans', { cookie, cache: 'no-store' });
}

export async function getMySubscription(cookie: string | undefined): Promise<MySubscription> {
  return apiFetch<MySubscription>('/business/subscriptions/me', { cookie, cache: 'no-store' });
}
