import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { requireSession, getForwardedCookie } from '@/lib/api/session';
import { getGamificationMe, getUserBadges, getPointsHistory, getLeaderboard } from '@/lib/api/gamification';
import { safeFetch } from '@/lib/api/safe';
import { reasonLabel, pointsFormat } from '@/lib/gamification';
import { imageOrFallback } from '@/lib/img';
import { TierBadge } from '@/components/gamification/TierBadge';
import { TierProgressBar } from '@/components/gamification/TierProgressBar';
import { StreakCard } from '@/components/gamification/StreakCard';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { CountUp } from '@/components/gamification/CountUp';
import styles from './page.module.css';

export const metadata = { title: 'Your Progress · Markt' };

export default async function GamificationPage() {
  const user = await requireSession('/app/gamification');
  const cookie = await getForwardedCookie();

  const [me, badges, history, leaderboard] = await Promise.all([
    safeFetch(() => getGamificationMe(cookie), null),
    safeFetch(() => getUserBadges(user.id, cookie), []),
    safeFetch(() => getPointsHistory(cookie, { limit: 5 }), { items: [], next_cursor: null }),
    safeFetch(() => getLeaderboard(cookie, { scope: 'global', period: 'weekly', limit: 3 }), null),
  ]);

  if (!me) {
    return (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Your Progress</h1>
        <p className={styles.emptyText}>Rewards are warming up — check back soon.</p>
      </div>
    );
  }

  const earned = me.badges_earned ?? badges.filter((b) => b.earned).length;
  const total = me.badges_total ?? badges.length;
  const rank = me.weekly_rank?.rank;

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.pageTitle}>Your Progress</h1>
        <p className={styles.pageSub}>Earn points by buying, selling and posting.</p>
      </div>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <TierBadge tier={me.tier.key} name={me.tier.name} stars={me.tier.stars} size="lg" showName />
        </div>
        <div>
          <div className={styles.heroPoints}>
            <CountUp value={me.lifetime_points} />
          </div>
          <p className={styles.heroPointsLabel}>lifetime points</p>
        </div>
        <TierProgressBar progress={me.tier.progress_to_next} pointsToNext={me.tier.points_to_next_tier} />
      </section>

      {me.streak && <StreakCard streak={me.streak} />}

      {/* Quick stats */}
      <div className={styles.tiles}>
        <div className={styles.tile}>
          <div className={styles.tileValue}>{pointsFormat(me.weekly_points)}</div>
          <div className={styles.tileLabel}>This week</div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tileValue}>
            {earned}
            <span style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>/{total}</span>
          </div>
          <div className={styles.tileLabel}>Badges</div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tileValue}>{rank ? `#${rank}` : '—'}</div>
          <div className={styles.tileLabel}>Rank</div>
        </div>
      </div>

      {/* Recent activity */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Recent activity</h2>
          <Link href="/app/gamification/points-history" className={styles.seeAll}>
            See all <ChevronRight size={14} />
          </Link>
        </div>
        {history.items.length === 0 ? (
          <p className={styles.emptyText}>No activity yet — earn points by buying, selling and posting.</p>
        ) : (
          history.items.map((item) => (
            <div key={item.id} className={styles.ledgerRow}>
              <div className={styles.ledgerLeft}>
                <div className={styles.ledgerReason}>{reasonLabel(item.reason)}</div>
                <div className={styles.ledgerDate}>{new Date(item.created_at).toLocaleDateString()}</div>
              </div>
              <span className={item.delta >= 0 ? styles.deltaPos : styles.deltaNeg}>
                {item.delta >= 0 ? '+' : '−'}
                {Math.abs(item.delta).toLocaleString('en-NG')}
              </span>
            </div>
          ))
        )}
      </section>

      {/* Badges */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Badges</h2>
        </div>
        {badges.length === 0 ? (
          <p className={styles.emptyText}>Badges you earn will appear here.</p>
        ) : (
          <BadgeGrid badges={badges} />
        )}
      </section>

      {/* Leaderboard preview */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Leaderboard · this week</h2>
          <Link href="/app/gamification/leaderboard" className={styles.seeAll}>
            Open <ChevronRight size={14} />
          </Link>
        </div>
        {!leaderboard || leaderboard.items.length === 0 ? (
          <p className={styles.emptyText}>Leaderboard is warming up.</p>
        ) : (
          leaderboard.items.map((row) => (
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
    </div>
  );
}
