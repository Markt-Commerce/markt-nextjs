import Link from 'next/link';
import { Store } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { listMarkets } from '@/lib/api/markets';
import { safeFetch } from '@/lib/api/safe';
import styles from './markets.module.css';

export const metadata = { title: 'Markets · Markt' };

export default async function MarketsPage() {
  await requireSession('/app/markets');
  const cookie = await getForwardedCookie();
  const markets = await safeFetch(() => listMarkets(cookie), []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Markets</h1>
      <p className={styles.sub}>Shop the markets near you — browse sellers grouped by where they trade.</p>

      {markets.length === 0 ? (
        <div className={styles.emptyState}>No markets to show yet — check back soon.</div>
      ) : (
        <div className={styles.grid}>
          {markets.map((m) => (
            <Link key={m.id} href={`/app/markets/${m.id}`} className={styles.card}>
              <span className={styles.cardIcon}>
                <Store size={20} />
              </span>
              <div className={styles.cardBody}>
                <div className={styles.cardName}>{m.name}</div>
                <div className={styles.cardMeta}>
                  {m.seller_count.toLocaleString('en-NG')} seller{m.seller_count === 1 ? '' : 's'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
