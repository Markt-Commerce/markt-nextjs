import 'server-only';
import { apiFetch } from './client';
import type { BlockedUser, ReportContentType, ReportReason } from '@/lib/types/moderation';

export async function reportContent(
  body: { content_id: string; content_type: ReportContentType; reason: ReportReason; details?: string },
  cookie: string | undefined
): Promise<void> {
  await apiFetch('/moderation/reports', { method: 'POST', cookie, body });
}

/** Users the current user has blocked. Defensive to array / {items} / {blocked}. */
export async function listBlocked(cookie: string | undefined): Promise<BlockedUser[]> {
  const res = await apiFetch<unknown>('/moderation/blocks', { cookie, cache: 'no-store' }).catch(() => null);
  if (Array.isArray(res)) return res as BlockedUser[];
  if (res && typeof res === 'object') {
    const obj = res as { items?: unknown; blocked?: unknown; blocks?: unknown };
    for (const v of [obj.items, obj.blocked, obj.blocks]) if (Array.isArray(v)) return v as BlockedUser[];
  }
  return [];
}

export async function blockUser(userId: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/moderation/blocks/${encodeURIComponent(userId)}`, { method: 'POST', cookie });
}

export async function unblockUser(userId: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/moderation/blocks/${encodeURIComponent(userId)}`, { method: 'DELETE', cookie });
}
