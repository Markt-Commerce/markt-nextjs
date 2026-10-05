import { Flame } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Streak } from '@/lib/types/gamification';
import styles from './gamification.module.css';

export function StreakCard({ streak }: { streak: Streak }) {
  const alive = streak.days > 0 && streak.active_today;

  const sub =
    streak.days === 0
      ? 'Start a streak by opening Markt tomorrow'
      : alive
        ? `Longest: ${streak.longest} day${streak.longest === 1 ? '' : 's'}`
        : 'Open Markt today to keep it alive';

  return (
    <div className={styles.streakCard}>
      <span className={styles.streakIcon}>
        <Flame
          size={30}
          className={cn(alive ? styles.streakAlive : styles.streakLapsed, alive && styles.breathing)}
          fill={alive ? 'currentColor' : 'none'}
        />
      </span>
      <div className={styles.streakBody}>
        <span className={styles.streakDays}>
          {streak.days} day{streak.days === 1 ? '' : 's'} streak
        </span>
        <span className={styles.streakSub}>{sub}</span>
      </div>
    </div>
  );
}
