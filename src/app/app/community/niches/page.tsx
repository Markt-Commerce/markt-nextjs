import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { listNiches, listMyNiches } from '@/lib/api/niches';
import { safeFetch } from '@/lib/api/safe';
import type { Niche } from '@/lib/types/niche';
import { JoinButton } from './join-button';
import styles from './niches.module.css';

export const metadata = { title: 'Communities · Markt' };

function NicheCard({ niche }: { niche: Niche }) {
  return (
    <Link href={`/app/community/niches/${niche.id}`} className={styles.card}>
      <div className={styles.cardBanner} style={niche.banner_url ? { backgroundImage: `url(${niche.banner_url})` } : undefined} />
      <div className={styles.cardBody}>
        <div className={styles.cardHead}>
          <span className={styles.cardAvatar}>
            {niche.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={niche.image_url} alt="" className={styles.cardAvatar} style={{ margin: 0, border: 0 }} />
            ) : (
              <Users size={20} />
            )}
          </span>
        </div>
        <span className={styles.cardName}>{niche.name}</span>
        {niche.description && <p className={styles.cardDesc}>{niche.description}</p>}
        <div className={styles.cardFoot}>
          <span className={styles.cardMeta}>
            {niche.member_count.toLocaleString('en-NG')} member{niche.member_count === 1 ? '' : 's'}
          </span>
          <JoinButton nicheId={niche.id} initialMember={niche.is_member} size="sm" />
        </div>
      </div>
    </Link>
  );
}

export default async function NichesPage() {
  await requireSession('/app/community/niches');
  const cookie = await getForwardedCookie();

  const [discover, mine] = await Promise.all([
    safeFetch(() => listNiches(cookie), { items: [], pagination: { page: 1, per_page: 30, total_items: 0, total_pages: 0 } }),
    safeFetch(() => listMyNiches(cookie), { items: [], pagination: { page: 1, per_page: 50, total_items: 0, total_pages: 0 } }),
  ]);

  const myNiches = mine.items.map((m) => m.niche).filter((n): n is Niche => !!n);
  const myIds = new Set(myNiches.map((n) => n.id));
  const toDiscover = discover.items.filter((n) => !myIds.has(n.id));

  return (
    <div className={styles.page}>
      <Link href="/app/community/social-feed" className={styles.breadcrumb}>
        <ArrowLeft size={15} /> Community
      </Link>
      <h1 className={styles.title}>Communities</h1>
      <p className={styles.sub}>Find your people — niches for the things you buy, sell, and love.</p>

      {myNiches.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Your communities</h2>
          <div className={styles.grid}>
            {myNiches.map((n) => (
              <NicheCard key={n.id} niche={{ ...n, is_member: true }} />
            ))}
          </div>
        </section>
      )}

      <section className={myNiches.length > 0 ? styles.sectionGap : undefined}>
        <h2 className={styles.sectionTitle}>{myNiches.length > 0 ? 'Discover more' : 'Discover'}</h2>
        {toDiscover.length === 0 ? (
          <div className={styles.emptyState}>No communities to discover right now — check back soon.</div>
        ) : (
          <div className={styles.grid}>
            {toDiscover.map((n) => (
              <NicheCard key={n.id} niche={n} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
