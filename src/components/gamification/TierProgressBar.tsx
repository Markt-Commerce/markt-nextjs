import { pointsFormat } from '@/lib/gamification';
import styles from './gamification.module.css';

export function TierProgressBar({ progress, pointsToNext }: { progress: number; pointsToNext: number }) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
      {pointsToNext > 0 ? (
        <p className={styles.progressHint}>{pointsFormat(pointsToNext)} points to the next tier</p>
      ) : (
        <p className={styles.progressHint}>Top tier reached — nice.</p>
      )}
    </div>
  );
}
