import 'server-only';
import { apiFetch } from './client';
import type {
  Badge,
  GamificationMe,
  Leaderboard,
  LeaderboardPeriod,
  LeaderboardScope,
  PointsHistory,
  TierConfig,
  UnseenAchievements,
  UserBadge,
} from '@/lib/types/gamification';

/** Normalise an endpoint that may return a bare array or `{ items }`. */
function asItems<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && Array.isArray((res as { items?: unknown }).items)) {
    return (res as { items: T[] }).items;
  }
  return [];
}

export async function getGamificationMe(cookie: string | undefined): Promise<GamificationMe> {
  return apiFetch<GamificationMe>('/gamification/me', { cookie, cache: 'no-store' });
}

export async function getTiers(cookie: string | undefined): Promise<TierConfig[]> {
  return apiFetch<unknown>('/gamification/tiers', { cookie, next: { revalidate: 600 } }).then((r) => asItems<TierConfig>(r));
}

export async function getBadgeCatalog(cookie: string | undefined): Promise<Badge[]> {
  return apiFetch<unknown>('/gamification/badges', { cookie, next: { revalidate: 300 } }).then((r) => asItems<Badge>(r));
}

export async function getUserBadges(userId: string, cookie: string | undefined): Promise<UserBadge[]> {
  return apiFetch<unknown>(`/gamification/users/${encodeURIComponent(userId)}/badges`, { cookie, cache: 'no-store' }).then((r) =>
    asItems<UserBadge>(r)
  );
}

export async function getPointsHistory(
  cookie: string | undefined,
  opts: { cursor?: string; limit?: number } = {}
): Promise<PointsHistory> {
  const params = new URLSearchParams();
  if (opts.cursor) params.set('cursor', opts.cursor);
  params.set('limit', String(opts.limit ?? 20));
  const res = await apiFetch<{ items?: PointsHistoryItemRaw[]; next_cursor?: string | null }>(
    `/gamification/points/history?${params.toString()}`,
    { cookie, cache: 'no-store' }
  );
  return { items: (res.items ?? []) as PointsHistory['items'], next_cursor: res.next_cursor ?? null };
}
type PointsHistoryItemRaw = PointsHistory['items'][number];

export async function getLeaderboard(
  cookie: string | undefined,
  opts: { scope?: LeaderboardScope; period?: LeaderboardPeriod; cursor?: string; limit?: number } = {}
): Promise<Leaderboard> {
  const scope = opts.scope ?? 'global';
  const period = opts.period ?? 'alltime';
  const params = new URLSearchParams({ scope, period });
  if (opts.cursor) params.set('cursor', opts.cursor);
  params.set('limit', String(opts.limit ?? 50));
  const res = await apiFetch<Partial<Leaderboard>>(`/gamification/leaderboard?${params.toString()}`, {
    cookie,
    cache: 'no-store',
  });
  return {
    scope,
    period,
    items: res.items ?? [],
    next_cursor: res.next_cursor ?? null,
    your_rank: res.your_rank,
  };
}

export async function getUnseenAchievements(cookie: string | undefined): Promise<UnseenAchievements> {
  const res = await apiFetch<Partial<UnseenAchievements>>('/gamification/me/achievements/unseen', {
    cookie,
    cache: 'no-store',
  });
  return { badges: res.badges ?? [], tier_up: res.tier_up ?? null, streak: res.streak ?? null };
}

export async function markAchievementsSeen(
  body: { badge_slugs?: string[]; tier?: boolean; streak?: boolean },
  cookie: string | undefined
): Promise<void> {
  await apiFetch('/gamification/me/achievements/seen', { method: 'POST', cookie, body });
}

export async function updateLeaderboardOptOut(optOut: boolean, cookie: string | undefined): Promise<{ opt_out_leaderboard: boolean }> {
  return apiFetch('/gamification/me/preferences', { method: 'PATCH', cookie, body: { opt_out_leaderboard: optOut } });
}
