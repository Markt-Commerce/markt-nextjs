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

export interface AccountDeletionBlocker {
  code?: string;
  message?: string;
}

export interface AccountDeletionPreview {
  can_delete: boolean;
  blockers: AccountDeletionBlocker[];
}

/** Whether this account can be deleted, and why not if it can't. */
export async function getAccountDeletionPreview(cookie: string | undefined): Promise<AccountDeletionPreview> {
  return apiFetch<AccountDeletionPreview>('/users/account/deletion-check', { cookie, cache: 'no-store' });
}

/** Permanently delete the signed-in user's account. */
export async function deleteAccount(cookie: string | undefined): Promise<void> {
  await apiFetch('/users/account', { method: 'DELETE', cookie });
}
