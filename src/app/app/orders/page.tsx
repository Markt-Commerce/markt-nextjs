import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import { cn } from '@/lib/cn';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { listOrders, listSellerOrders, type SellerOrderItem } from '@/lib/api/orders';
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

function statusBadge(status: string) {
  return <span className={cn(styles.statusBadge, styles[STATUS_CLASS[status] ?? 'statusPending'])}>{status.replace(/_/g, ' ')}</span>;
}

export default async function OrdersPage() {
  const user = await requireSession();
  const cookie = await getForwardedCookie();

  if (user.current_role === 'seller') {
    const items = await safeFetch(() => listSellerOrders(cookie), []);
    return <SellerOrders items={items} />;
  }

  const orders = await safeFetch(() => listOrders(cookie), []);
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Orders</h1>
      <p className={styles.subtitle}>Track the things you&apos;ve bought.</p>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          No orders yet. <Link href="/app/marketplace">Browse the marketplace</Link> to place your first one.
        </div>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => (
            <Link key={order.id} href={`/app/orders/${order.id}`} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.orderNumber}>#{order.order_number}</span>
                {statusBadge(order.status)}
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()} · {orderTotalItems(order)} item{orderTotalItems(order) === 1 ? '' : 's'}
                </span>
                <span className={styles.total}>{formatNaira(orderTotal(order))}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Seller-facing: the individual product lines buyers ordered, to prepare. */
function SellerOrders({ items }: { items: SellerOrderItem[] }) {
  const toPrepare = items.filter((i) => (i.status ?? 'pending') === 'pending' || i.status === 'processing').length;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Orders to fulfil</h1>
      <p className={styles.subtitle}>
        {items.length === 0
          ? 'Items buyers order from your shop show up here to prepare.'
          : `${toPrepare} item${toPrepare === 1 ? '' : 's'} waiting to be prepared.`}
      </p>

      {items.length === 0 ? (
        <div className={styles.emptyState}>No orders to fulfil yet. When a buyer orders your products, they&apos;ll appear here.</div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => {
            const img = item.product?.images?.[0]?.media?.thumbnail_url ?? item.product?.images?.[0]?.media?.original_url;
            const buyer = item.order?.recipient_name ?? item.order?.buyer?.username;
            const orderNo = item.order?.order_number ?? item.order_id;
            return (
              <Link key={item.id} href={`/app/orders/${item.order_id}`} className={styles.fulfilCard}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className={styles.fulfilThumb} />
                ) : (
                  <span className={styles.fulfilThumb} aria-hidden />
                )}
                <div className={styles.fulfilBody}>
                  <p className={styles.fulfilName}>{item.product?.name ?? 'Product'}</p>
                  <p className={styles.fulfilMeta}>
                    Qty {item.quantity} · Order #{orderNo}
                    {buyer ? ` · for ${buyer}` : ''}
                  </p>
                </div>
                <div className={styles.fulfilRight}>
                  {statusBadge(item.status ?? 'pending')}
                  <span className={styles.total}>{formatNaira(item.price * item.quantity)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
