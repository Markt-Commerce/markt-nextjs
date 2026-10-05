'use client';

import { useEffect, useMemo } from 'react';
import { Award, Star, Flame, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './celebration.module.css';

export type CelebrationKind = 'badge' | 'tier' | 'streak' | 'points';

export interface Celebration {
  id: string; // kind:key, for de-dupe
  kind: CelebrationKind;
  title: string;
  body: string;
}

const KIND_ICON: Record<CelebrationKind, LucideIcon> = {
  badge: Award,
  tier: Star,
  streak: Flame,
  points: Sparkles,
};

const KIND_CLASS: Partial<Record<CelebrationKind, string>> = {
  tier: styles.kindTier,
  streak: styles.kindStreak,
};

const CONFETTI_COLORS = ['#E94C2A', '#f4a63a', '#3ba55d', '#4a90d9', '#9b59b6'];

function ConfettiLayer() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        left: `${(i * 37) % 100}%`,
        bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${(i % 7) * 0.08}s`,
        duration: `${1 + ((i * 13) % 10) / 10}s`,
      })),
    []
  );
  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={styles.confettiPiece}
          style={{ left: p.left, background: p.bg, animationDelay: p.delay, animationDuration: p.duration }}
        />
      ))}
    </div>
  );
}

/** One full-screen celebration. Auto-dismisses at 2.4s; tap/Esc also dismiss. */
export function CelebrationOverlay({ celebration, onDismiss }: { celebration: Celebration; onDismiss: () => void }) {
  const Icon = KIND_ICON[celebration.kind];

  useEffect(() => {
    const t = setTimeout(onDismiss, 2400);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [onDismiss, celebration.id]);

  return (
    <div className={cn(styles.overlay, KIND_CLASS[celebration.kind])} role="alertdialog" aria-live="assertive" onClick={onDismiss}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <ConfettiLayer />
        <span className={styles.iconWrap}>
          <Icon size={30} />
        </span>
        <h2 className={styles.title}>{celebration.title}</h2>
        <p className={styles.body}>{celebration.body}</p>
        <button type="button" className={styles.dismiss} onClick={onDismiss} autoFocus>
          Nice!
        </button>
      </div>
    </div>
  );
}
