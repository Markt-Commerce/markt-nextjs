import 'server-only';
import { apiFetch, apiFetchMultipart } from './client';
import type { UserProfile } from '@/lib/types/user';

export async function updateProfile(body: { phone_number?: string }, cookie: string | undefined): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/profile', { method: 'PATCH', cookie, body });
}

export async function updateBuyerProfile(body: { buyername?: string }, cookie: string | undefined): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/profile/buyer', { method: 'PATCH', cookie, body });
}

export async function updateSellerProfile(
  body: { shop_name?: string; description?: string },
  cookie: string | undefined
): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/profile/seller', { method: 'PATCH', cookie, body });
}

export async function uploadProfilePicture(formData: FormData, cookie: string | undefined): Promise<void> {
  await apiFetchMultipart('/users/profile/picture', formData, cookie);
}
