import { Sprout, Zap, Handshake, Store, Building2, Crown, Star, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { tierIsEarned } from '@/lib/gamification';
import type { TierKey } from '@/lib/types/gamification';
import styles from './gamification.module.css';

// One distinct silhouette per tier (NOT stars — stars are review ratings).
const TIER_ICON: Record<TierKey, LucideIcon> = {
  newcomer: Sprout,
  hustler: Zap,
  trader: Handshake,
  merchant: Store,
  magnate: Building2,
  mogul: Crown,
};

const ICON_SIZE = { sm: 14, md: 18, lg: 26 } as const;
const CHIP_CLASS = { sm: styles.tierChipSm, md: styles.tierChipMd, lg: styles.tierChipLg } as const;

export function TierBadge({
  tier,
  name,
  stars,
  size = 'md',
  showName = false,
}: {
  tier: TierKey;
  name?: string;
  stars?: number;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}) {
  const Icon = TIER_ICON[tier] ?? Sprout;
  const earned = tierIsEarned(tier);

  return (
    <span className={styles.tierBadge}>
      <span
        className={cn(styles.tierChip, CHIP_CLASS[size], earned ? styles.tierEarned : styles.tierNeutral)}
        title={name ?? tier}
        aria-label={`${name ?? tier} tier`}
      >
        <Icon size={ICON_SIZE[size]} />
      </span>
      {showName && (
        <span className={styles.tierName}>
          {name ?? tier}
          {typeof stars === 'number' && stars > 0 && (
            <span className={styles.tierStars} aria-label={`${stars} stars`}>
              {' '}
              {Array.from({ length: stars }).map((_, i) => (
                <Star key={i} size={10} fill="currentColor" />
              ))}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
