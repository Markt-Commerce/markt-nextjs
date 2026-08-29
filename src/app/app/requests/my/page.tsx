import Link from 'next/link';
import { Clipboard, Plus, MessageSquare } from 'lucide-react';
import { getForwardedCookie } from '@/lib/api/session';
import { listMyRequests } from '@/lib/api/requests';
import { safeFetch } from '@/lib/api/safe';
import { cn } from '@/lib/cn';
import styles from '../page.module.css';

const STATUS_CLASS: Record<string, string> = {
  OPEN: 'statusOpen',
  FULFILLED: 'statusFulfilled',
  CLOSED: 'statusClosed',
  EXPIRED: 'statusExpired',
};

export default async function MyRequestsPage() {
  const cookie = await getForwardedCookie();
  const data = await safeFetch(() => listMyRequests(cookie), {
    items: [],
    pagination: { page: 1, per_page: 20, total_items: 0, total_pages: 0 },
  });

  return (
    <div className={styles.page}>
      <div className={styles.headRow}>
        <h1 className={styles.title}>
          <Clipboard size={22} /> My Buy Requests
        </h1>
        <Link href="/app/requests/create" className={styles.newBtn}>
          <Plus size={14} /> New Request
        </Link>
      </div>

      {data.items.length === 0 && <div className={styles.emptyState}>You haven&apos;t posted any requests yet.</div>}

      {data.items.length > 0 && (
        <div className={styles.list}>
          {data.items.map((request) => (
            <Link key={request.id} href={`/app/requests/${request.id}`} className={styles.card}>
              <div className={styles.cardHead}>
                <p className={styles.cardTitle}>{request.title}</p>
                <span className={cn(styles.statusBadge, styles[STATUS_CLASS[request.status]])}>{request.status.toLowerCase()}</span>
              </div>
              <p className={styles.cardDesc}>{request.description}</p>
              <div className={styles.metaRow}>
                {!!request.budget && <span className={styles.budgetTag}>Budget: ${request.budget.toFixed(2)}</span>}
                <span>
                  <MessageSquare size={12} style={{ display: 'inline', marginRight: 3 }} />
                  {request.offers.length} offer{request.offers.length === 1 ? '' : 's'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
