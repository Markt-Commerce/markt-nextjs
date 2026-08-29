import Link from 'next/link';
import { Plus, MessageSquare, Eye } from 'lucide-react';
import { getForwardedCookie } from '@/lib/api/session';
import { listRequests } from '@/lib/api/requests';
import { safeFetch } from '@/lib/api/safe';
import type { BuyerRequest } from '@/lib/types/request';
import { cn } from '@/lib/cn';
import styles from './page.module.css';

const STATUS_CLASS: Record<string, string> = {
  OPEN: 'statusOpen',
  FULFILLED: 'statusFulfilled',
  CLOSED: 'statusClosed',
  EXPIRED: 'statusExpired',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (diff < day) return 'today';
  if (diff < 2 * day) return 'yesterday';
  return `${Math.floor(diff / day)} days ago`;
}

export function RequestCard({ request }: { request: BuyerRequest }) {
  const replies = request.offers.length;
  return (
    <Link href={`/app/requests/${request.id}`} className={styles.card}>
      <span className={cn(styles.statusBadge, styles[STATUS_CLASS[request.status]])}>{request.status.toLowerCase()}</span>

      <div className={styles.asker}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={request.user?.profile_picture_url || '/Logo.png'} alt="" className={styles.askerAvatar} />
        <span className={styles.askerText}>
          <strong>{request.user?.username ?? 'A buyer'}</strong> is looking for · {timeAgo(request.created_at)}
        </span>
      </div>

      <h2 className={styles.cardTitle}>{request.title}</h2>
      <p className={styles.cardDesc}>{request.description}</p>

      <div className={styles.cardFooter}>
        {!!request.budget && <span className={styles.budgetChip}>Budget ${request.budget.toFixed(2)}</span>}
        <span className={cn(styles.repliesChip, replies > 0 ? styles.repliesActive : styles.repliesNone)}>
          <MessageSquare size={13} />
          {replies === 0 ? 'No offers yet' : `${replies} offer${replies === 1 ? '' : 's'}`}
        </span>
        <span className={styles.metaDot}>
          <Eye size={13} /> {request.views}
        </span>
      </div>
    </Link>
  );
}

export default async function RequestsPage() {
  const cookie = await getForwardedCookie();
  const data = await safeFetch(() => listRequests({ status: 'OPEN' }, cookie), {
    items: [],
    pagination: { page: 1, per_page: 20, total_items: 0, total_pages: 0 },
  });

  return (
    <div className={styles.page}>
      <div className={styles.headRow}>
        <h1 className={styles.title}>Buy requests</h1>
        <Link href="/app/requests/create" className={styles.newBtn}>
          <Plus size={15} /> Post a request
        </Link>
      </div>
      <p className={styles.subtitle}>People asking for things. Have it? Send them an offer.</p>

      {data.items.length === 0 ? (
        <div className={styles.emptyState}>No open requests right now. Check back soon.</div>
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
