import Link from 'next/link';
import { cn } from '@/lib/cn';
import { getForwardedCookie } from '@/lib/api/session';
import { listOrders } from '@/lib/api/orders';
import { safeFetch } from '@/lib/api/safe';
import { orderTotal, orderTotalItems } from '@/lib/types/order';
import styles from './page.module.css';

const STATUS_CLASS: Record<string, string> = {
  pending_payment: 'statusPending',
  ready_for_delivery: 'statusProcessing',
  pending: 'statusPending',
  processing: 'statusProcessing',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled',
  returned: 'statusReturned',
  failed: 'statusCancelled',
};

export default async function OrdersPage() {
  const cookie = await getForwardedCookie();
  const orders = await safeFetch(() => listOrders(cookie), []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Orders</h1>

      {orders.length === 0 && (
        <div className={styles.emptyState}>
          No orders yet. <Link href="/app/marketplace">Browse the marketplace</Link> to place your first one.
        </div>
      )}

      {orders.length > 0 && (
        <div className={styles.list}>
          {orders.map((order) => (
            <Link key={order.id} href={`/app/orders/${order.id}`} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.orderNumber}>#{order.order_number}</span>
                <span className={cn(styles.statusBadge, styles[STATUS_CLASS[order.status]])}>{order.status.replace('_', ' ')}</span>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()} · {orderTotalItems(order)} item{orderTotalItems(order) === 1 ? '' : 's'}
                </span>
                <span className={styles.total}>₦{orderTotal(order).toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
