'use server';

import { revalidatePath } from 'next/cache';
import { getForwardedCookie } from '@/lib/api/session';
import {
  getGamificationMe,
  getPointsHistory,
  getUnseenAchievements,
  markAchievementsSeen,
  updateLeaderboardOptOut,
} from '@/lib/api/gamification';
import type { PointsHistory, UnseenAchievements } from '@/lib/types/gamification';

/** Next page of the points ledger (cursor-paginated), for the "Load more" button. */
export async function loadMoreHistoryAction(cursor: string): Promise<PointsHistory> {
  return getPointsHistory(await getForwardedCookie(), { cursor, limit: 20 }).catch(() => ({ items: [], next_cursor: null }));
}

/** Everything the client celebration layer needs in one round-trip. */
export async function fetchCelebrationFeedAction(): Promise<{ lifetimePoints: number | null; unseen: UnseenAchievements }> {
  const cookie = await getForwardedCookie();
  const [me, unseen] = await Promise.all([
    getGamificationMe(cookie).catch(() => null),
    getUnseenAchievements(cookie).catch(() => ({ badges: [], tier_up: null, streak: null }) as UnseenAchievements),
  ]);
  return { lifetimePoints: me?.lifetime_points ?? null, unseen };
}

/** Acknowledge celebrations once the user has seen them, so the server stops offering them. */
export async function markSeenAction(body: { badge_slugs?: string[]; tier?: boolean; streak?: boolean }): Promise<void> {
  try {
    await markAchievementsSeen(body, await getForwardedCookie());
  } catch {
    // Best-effort — a failed ack just means it may reappear on next open.
  }
}

export async function setLeaderboardOptOutAction(optOut: boolean): Promise<{ ok: boolean }> {
  try {
    await updateLeaderboardOptOut(optOut, await getForwardedCookie());
  } catch {
    return { ok: false };
  }
  revalidatePath('/app/gamification/leaderboard');
  return { ok: true };
}
