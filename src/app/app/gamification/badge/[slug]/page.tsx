import Link from 'next/link';
import { ArrowLeft, Award, Lock, CheckCircle2 } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getUserBadges } from '@/lib/api/gamification';
import { safeFetch } from '@/lib/api/safe';
import { cn } from '@/lib/cn';
import styles from '../../page.module.css';

export default async function BadgeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireSession(`/app/gamification/badge/${slug}`);
  const cookie = await getForwardedCookie();
  const badges = await safeFetch(() => getUserBadges(user.id, cookie), []);
  const badge = badges.find((b) => b.slug === slug);

  return (
    <div className={styles.page}>
      <Link href="/app/gamification" className={styles.breadcrumb}>
        <ArrowLeft size={15} /> Your Progress
      </Link>

      <div className={styles.badgeDetail}>
        {badge?.icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={badge.icon_url} alt="" className={styles.badgeHeroArt} />
        ) : (
          <span className={cn(styles.badgeHeroArt, badge?.earned && styles.badgeHeroEarned)}>
            {badge?.earned ? <Award size={44} /> : <Lock size={40} />}
          </span>
        )}

        <h1 className={styles.badgeHeroName}>{badge?.name ?? 'Badge'}</h1>
        {badge?.description && <p className={styles.badgeHeroDesc}>{badge.description}</p>}

        {badge?.earned ? (
          <span className={styles.earnedTag}>
            <CheckCircle2 size={16} /> Earned
            {badge.awarded_at ? ` · ${new Date(badge.awarded_at).toLocaleDateString()}` : ''}
          </span>
        ) : badge && badge.progress > 0 && badge.progress < 1 ? (
          <div style={{ maxWidth: 260, margin: '0 auto' }}>
            <div className={styles.lbRow} style={{ padding: 0, display: 'block' }}>
              <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(badge.progress * 100)}%`, background: 'var(--brand)', borderRadius: 999 }} />
              </div>
            </div>
            <p className={styles.pageSub} style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              {Math.round(badge.progress * 100)}% of the way there
            </p>
          </div>
        ) : (
          <p className={styles.pageSub}>Keep using Markt to unlock this one.</p>
        )}
      </div>
    </div>
  );
}
