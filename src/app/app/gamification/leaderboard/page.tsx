import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireSession, getForwardedCookie } from '@/lib/api/session';
import { getGamificationMe, getLeaderboard } from '@/lib/api/gamification';
import { safeFetch } from '@/lib/api/safe';
import { pointsFormat } from '@/lib/gamification';
import { imageOrFallback } from '@/lib/img';
import { TierBadge } from '@/components/gamification/TierBadge';
import type { LeaderboardPeriod, LeaderboardScope } from '@/lib/types/gamification';
import { OptOutToggle } from './opt-out-toggle';
import styles from '../page.module.css';

export const metadata = { title: 'Leaderboard · Markt' };

const SCOPES: { key: LeaderboardScope; label: string }[] = [
  { key: 'global', label: 'Everyone' },
  { key: 'buyers', label: 'Buyers' },
  { key: 'sellers', label: 'Sellers' },
];
const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'alltime', label: 'All time' },
  { key: 'weekly', label: 'This week' },
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; period?: string }>;
}) {
  const user = await requireSession('/app/gamification/leaderboard');
  const cookie = await getForwardedCookie();
  const sp = await searchParams;
  const scope: LeaderboardScope = SCOPES.some((s) => s.key === sp.scope) ? (sp.scope as LeaderboardScope) : 'global';
  const period: LeaderboardPeriod = sp.period === 'weekly' ? 'weekly' : 'alltime';

  const [board, me] = await Promise.all([
    safeFetch(() => getLeaderboard(cookie, { scope, period, limit: 50 }), null),
    safeFetch(() => getGamificationMe(cookie), null),
  ]);

  const href = (s: LeaderboardScope, p: LeaderboardPeriod) => `/app/gamification/leaderboard?scope=${s}&period=${p}`;

  return (
    <div className={styles.page}>
      <Link href="/app/gamification" className={styles.breadcrumb}>
        <ArrowLeft size={15} /> Your Progress
      </Link>
      <h1 className={styles.pageTitle}>Leaderboard</h1>

      <div className={styles.tabsRow}>
        <div className={styles.segment}>
          {SCOPES.map((s) => (
            <Link key={s.key} href={href(s.key, period)} className={`${styles.segBtn} ${scope === s.key ? styles.segBtnActive : ''}`}>
              {s.label}
            </Link>
          ))}
        </div>
        <div className={styles.segment}>
          {PERIODS.map((p) => (
            <Link key={p.key} href={href(scope, p.key)} className={`${styles.segBtn} ${period === p.key ? styles.segBtnActive : ''}`}>
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {board?.your_rank && (
        <div className={styles.yourRank}>
          <span>Your rank</span>
          <span>
            #{board.your_rank.rank} of {board.your_rank.out_of.toLocaleString('en-NG')} · {pointsFormat(board.your_rank.points)} pts
          </span>
        </div>
      )}

      <section className={styles.section}>
        {!board || board.items.length === 0 ? (
          <p className={styles.emptyText}>Leaderboard is warming up.</p>
        ) : (
          board.items.map((row) => (
            <div key={row.user_id} className={`${styles.lbRow} ${row.user_id === user.id ? styles.lbCurrent : ''}`}>
              <span className={styles.lbRank}>{row.rank}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageOrFallback(row.profile_picture)} alt="" className={styles.lbAvatar} />
              <span className={styles.lbName}>
                {row.tier && <TierBadge tier={row.tier} size="sm" />}
                <span className={styles.lbNameText}>{row.username ?? 'Markt user'}</span>
              </span>
              <span className={styles.lbPoints}>{pointsFormat(row.points)}</span>
            </div>
          ))
        )}
      </section>

      <OptOutToggle initialOptOut={me?.opt_out_leaderboard ?? false} />
    </div>
  );
}
