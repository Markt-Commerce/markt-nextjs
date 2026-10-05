import Link from 'next/link';
import { Award, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { UserBadge } from '@/lib/types/gamification';
import styles from './gamification.module.css';

export function BadgeCard({ badge }: { badge: UserBadge }) {
  const showProgress = !badge.earned && badge.progress > 0 && badge.progress < 1;

  return (
    <Link
      href={`/app/gamification/badge/${badge.slug}`}
      className={cn(styles.badgeCard, !badge.earned && styles.badgeLocked, !badge.earned && styles.badgeShimmer)}
      title={badge.name}
    >
      {badge.icon_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={badge.icon_url} alt="" className={styles.badgeArt} />
      ) : (
        <span className={cn(styles.badgeArt, badge.earned ? styles.badgeArtEarned : styles.badgeArtLocked)}>
          {badge.earned ? <Award size={20} /> : <Lock size={18} />}
        </span>
      )}
      <span className={styles.badgeName}>{badge.name}</span>
      {showProgress && (
        <span className={styles.badgeProgressTrack}>
          <span className={styles.badgeProgressFill} style={{ width: `${Math.round(badge.progress * 100)}%` }} />
        </span>
      )}
    </Link>
  );
}

export function BadgeGrid({ badges }: { badges: UserBadge[] }) {
  const ordered = [...badges].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1; // earned first
    return (a.priority ?? 0) - (b.priority ?? 0);
  });

  return (
    <div className={styles.badgeGrid}>
      {ordered.map((b) => (
        <BadgeCard key={b.slug} badge={b} />
      ))}
    </div>
  );
}
