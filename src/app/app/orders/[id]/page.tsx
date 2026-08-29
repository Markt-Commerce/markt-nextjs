import Link from 'next/link';
import { Truck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getForwardedCookie } from '@/lib/api/session';
import { getOrder, trackOrder } from '@/lib/api/orders';
import { getProduct } from '@/lib/api/products';
import { primaryImageUrl } from '@/lib/types/product';
import { CancelButton } from './cancel-button';
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

const CANCELLABLE = new Set(['pending_payment', 'pending', 'processing']);

function str(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === 'string' ? value : undefined;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookie = await getForwardedCookie();

  let order;
  try {
    order = await getOrder(id, cookie);
  } catch {
    return (
      <div className={styles.page}>
        <p>This order couldn&apos;t be loaded right now.</p>
      </div>
    );
  }

  const tracking = await trackOrder(id, cookie).catch(() => null);
  const products = await Promise.all(order.items.map((item) => getProduct(item.product_id, cookie).catch(() => null)));

  const address = order.shipping_address;

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/orders">Orders</Link> / #{order.order_number}
      </nav>

      <div className={styles.headRow}>
        <div>
          <h1 className={styles.title}>Order #{order.order_number}</h1>
          <p className={styles.subtitle}>Placed {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <span className={cn(styles.statusBadge, styles[STATUS_CLASS[order.status]])}>{order.status.replace('_', ' ')}</span>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Items</p>
        {order.items.map((item, i) => {
          const product = products[i];
          return (
            <div key={i} className={styles.item}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(product && primaryImageUrl(product)) ?? '/assets/images/products/sony-headphones.png'}
                alt={product?.name ?? 'Product'}
                className={styles.itemImage}
              />
              <div className={styles.itemBody}>
                <p className={styles.itemName}>{product?.name ?? item.product_id}</p>
                <p className={styles.itemMeta}>
                  Qty {item.quantity} · <span className={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {address && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Shipping address</p>
          <p className={styles.addressText}>
            {str(address, 'house_number')} {str(address, 'street')}
            <br />
            {str(address, 'city')}, {str(address, 'state')} {str(address, 'postal_code')}
            <br />
            {str(address, 'country')}
          </p>
        </div>
      )}

      {tracking && tracking.timeline.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>
            <Truck size={14} style={{ display: 'inline', marginRight: 4 }} /> Tracking
          </p>
          <div className={styles.timeline}>
            {tracking.timeline.map((cp, i) => (
              <div key={i} className={styles.checkpoint}>
                <span className={styles.checkpointDot} />
                <span>{str(cp, 'status') ?? tracking.status}</span>
                <span className={styles.checkpointDate}>
                  {str(cp, 'occurred_at') ? new Date(str(cp, 'occurred_at')!).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Summary</p>
        <div className={styles.totalsRow}>
          <span>Subtotal</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        {!!order.shipping_fee && (
          <div className={styles.totalsRow}>
            <span>Shipping</span>
            <span>${order.shipping_fee.toFixed(2)}</span>
          </div>
        )}
        {!!order.discount && (
          <div className={styles.totalsRow}>
            <span>Discount</span>
            <span>-${order.discount.toFixed(2)}</span>
          </div>
        )}
        <div className={styles.totalsGrand}>
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      {CANCELLABLE.has(order.status) && <CancelButton orderId={order.id} />}
    </div>
  );
}
