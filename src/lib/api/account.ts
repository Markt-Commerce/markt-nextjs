import 'server-only';
import { apiFetch } from './client';
import type { Address, UserProfile } from '@/lib/types/user';

export async function updateAddress(body: Partial<Address>, cookie: string | undefined): Promise<Address> {
  return apiFetch<Address>('/users/address', { method: 'PATCH', cookie, body });
}

export async function switchRole(cookie: string | undefined): Promise<{ current_role: string }> {
  return apiFetch<{ current_role: string }>('/users/switch-role', { method: 'POST', cookie });
}

export async function createBuyerAccount(buyername: string, cookie: string | undefined): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/create-buyer', { method: 'POST', cookie, body: { buyername } });
}

export async function createSellerAccount(
  body: { shop_name: string; description: string; category_ids: number[] },
  cookie: string | undefined
): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/create-seller', { method: 'POST', cookie, body });
}
