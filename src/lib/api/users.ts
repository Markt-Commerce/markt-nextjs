import 'server-only';
import { apiFetch } from './client';

/** A person as returned by the `/users/` directory listing. */
export interface DirectoryUser {
  id: string;
  username: string;
  profile_picture_url?: string;
  is_seller: boolean;
  current_role: 'buyer' | 'seller';
}

interface UserPagination {
  items: DirectoryUser[];
  pagination: { page: number; per_page: number; total_items: number; total_pages: number };
}

/**
 * People to discover and follow. The API has no dedicated "suggested follows"
 * endpoint, so we draw from the user directory and let the caller filter out
 * the current user. Sellers surface first — following a shop is the point.
 */
export async function listPeopleToFollow(cookie: string | undefined, perPage = 12): Promise<DirectoryUser[]> {
  const res = await apiFetch<UserPagination>(`/users/?per_page=${perPage}&sort=-created_at`, { cookie, cache: 'no-store' });
  return res.items ?? [];
}
