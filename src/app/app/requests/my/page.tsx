import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getForwardedCookie } from '@/lib/api/session';
import { listMyRequests } from '@/lib/api/requests';
import { safeFetch } from '@/lib/api/safe';
import { RequestCard } from '../page';
import styles from '../page.module.css';

export default async function MyRequestsPage() {
  const cookie = await getForwardedCookie();
  const data = await safeFetch(() => listMyRequests(cookie), {
    items: [],
    pagination: { page: 1, per_page: 20, total_items: 0, total_pages: 0 },
  });

  return (
    <div className={styles.page}>
      <div className={styles.headRow}>
        <h1 className={styles.title}>My requests</h1>
        <Link href="/app/requests/create" className={styles.newBtn}>
          <Plus size={15} /> Post a request
        </Link>
      </div>
      <p className={styles.subtitle}>Things you&apos;ve asked for, and the offers coming in.</p>

      {data.items.length === 0 ? (
        <div className={styles.emptyState}>
          You haven&apos;t posted any requests yet. <Link href="/app/requests/create">Ask for something</Link>.
        </div>
      ) : (
        <div className={styles.list}>
          {data.items.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
