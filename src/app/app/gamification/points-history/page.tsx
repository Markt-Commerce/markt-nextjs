import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getPointsHistory } from '@/lib/api/gamification';
import { safeFetch } from '@/lib/api/safe';
import { LedgerList } from './ledger-list';
import styles from '../page.module.css';

export const metadata = { title: 'Points history · Markt' };

export default async function PointsHistoryPage() {
  await requireSession('/app/gamification/points-history');
  const cookie = await getForwardedCookie();
  const history = await safeFetch(() => getPointsHistory(cookie, { limit: 20 }), { items: [], next_cursor: null });

  return (
    <div className={styles.page}>
      <Link href="/app/gamification" className={styles.breadcrumb}>
        <ArrowLeft size={15} /> Your Progress
      </Link>
      <h1 className={styles.pageTitle}>Points history</h1>

      <section className={styles.section}>
        <LedgerList initialItems={history.items} initialCursor={history.next_cursor} />
      </section>
    </div>
  );
}
