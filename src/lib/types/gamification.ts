// Gamification model — mirrors the mobile client's §13 spec. The backend is the
// source of truth for every amount and threshold; the web app only renders what
// the server returns (no hard-coded point values or tier cutoffs).

export type TierKey = 'newcomer' | 'hustler' | 'trader' | 'merchant' | 'magnate' | 'mogul';

export const TIER_ORDER: TierKey[] = ['newcomer', 'hustler', 'trader', 'merchant', 'magnate', 'mogul'];

/** One tier's config from GET /gamification/tiers. */
export interface TierConfig {
  tier: TierKey;
  name: string;
  min_lifetime_points: number;
  color_hex?: string;
  star_count: number;
}

/** The viewer's current tier, as returned inside GET /gamification/me. */
export interface MeTier {
  key: TierKey;
  name: string;
  stars: number; // 0..5
  color_hex?: string;
  progress_to_next: number; // 0..1
  points_to_next_tier: number;
}

export interface Streak {
  days: number;
  longest: number;
  last_active_date?: string;
  active_today: boolean;
}

export interface RankSummary {
  scope: string;
  rank: number;
  out_of: number;
}

/** GET /gamification/me — the combined profile. Fields are defensively optional. */
export interface GamificationMe {
  lifetime_points: number;
  available_points: number;
  weekly_points: number;
  tier: MeTier;
  streak?: Streak;
  badges_earned?: number;
  badges_total?: number;
  weekly_rank?: RankSummary;
  opt_out_leaderboard?: boolean;
}

export interface PointsHistoryItem {
  id: string | number;
  delta: number;
  reason: string;
  ref_type?: string;
  ref_id?: string;
  balance_after: number;
  created_at: string;
}

export interface PointsHistory {
  items: PointsHistoryItem[];
  next_cursor: string | null;
}

export type BadgeAudience = 'S' | 'B' | 'BS';

export interface Badge {
  slug: string;
  name: string;
  description?: string;
  icon_url?: string;
  category?: string;
  audience: BadgeAudience;
  priority: number;
}

export interface UserBadge extends Badge {
  earned: boolean;
  awarded_at?: string;
  progress: number; // 0..1
}

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  points: number;
  username?: string;
  profile_picture?: string;
  tier?: TierKey;
  stars?: number;
}

export interface YourRank {
  scope: string;
  period: string;
  rank: number;
  points: number;
  out_of: number;
}

export interface Leaderboard {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  items: LeaderboardRow[];
  next_cursor: string | null;
  your_rank?: YourRank;
}

export type LeaderboardScope = 'global' | 'buyers' | 'sellers';
export type LeaderboardPeriod = 'alltime' | 'weekly';

/** GET /gamification/me/achievements/unseen — the drain-on-open payload. */
export interface UnseenAchievements {
  badges: Badge[];
  tier_up: { old_tier?: TierKey; new_tier: TierKey; stars?: number } | null;
  streak: { streak_days?: number; days?: number; longest_streak?: number; is_milestone?: boolean } | null;
}
