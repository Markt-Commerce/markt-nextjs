import type { TierKey } from '@/lib/types/gamification';

// Ledger reason → human label (§13.2). The POINT AMOUNT is never here — the
// client only renders the delta the server sent.
export const REASON_LABELS: Record<string, string> = {
  order_completed_buyer: 'Order completed',
  order_completed_seller: 'Sale completed',
  review_with_photo: 'Review with photo',
  review_text_only: 'Review posted',
  post_created: 'Post created',
  post_reaction_received: 'Post reaction',
  profile_completed: 'Profile completed',
  referral_first_paid: 'Referral bonus',
  daily_first_login: 'Daily login',
  order_reversed: 'Order reversed',
};

/** A reason's display label; unknown keys fall back to Title Case, de-underscored. */
export function reasonLabel(reason: string): string {
  if (REASON_LABELS[reason]) return REASON_LABELS[reason];
  return reason
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Tier colour is a PRESENTATION decision, not the server's color_hex: a single
// hex can't pass AA in both themes, so prestige is carried by icon + star count
// and colour only marks "earned the brand yet or not" (§13.3). `newcomer` stays
// neutral; every other tier uses the brand token.
export function tierIsEarned(key: TierKey): boolean {
  return key !== 'newcomer';
}

export function pointsFormat(n: number): string {
  return n.toLocaleString('en-NG');
}
