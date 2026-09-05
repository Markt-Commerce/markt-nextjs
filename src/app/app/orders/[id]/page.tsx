import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import { Check, Truck, XCircle } from 'lucide-react';
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
const STOPPED = new Set(['cancelled', 'returned', 'failed']);

// The many backend statuses collapse to a 4-stop journey a person can read
// at a glance — "where is my order", not "what enum value is this".
const JOURNEY = ['Placed', 'Preparing', 'Shipped', 'Delivered'];
function journeyIndex(status: string): number {
  if (status === 'pending_payment' || status === 'pending') return 0;
  if (status === 'ready_for_delivery' || status === 'processing') return 1;
  if (status === 'shipped') return 2;
  if (status === 'delivered') return 3;
  return 0;
}

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
  const stopped = STOPPED.has(order.status);
  const currentStep = journeyIndex(order.status);

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

      {stopped ? (
        <div className={styles.stoppedBanner}>
          <XCircle size={18} />
          {order.status === 'cancelled' && 'This order was cancelled.'}
          {order.status === 'returned' && 'This order was returned.'}
          {order.status === 'failed' && 'This order could not be completed.'}
        </div>
      ) : (
        <div className={styles.journey}>
          <div className={styles.journeyTrack}>
            {JOURNEY.map((label, i) => {
              const done = i < currentStep;
              const current = i === currentStep;
              return (
                <div key={label} className={styles.journeyStep}>
                  <span className={cn(styles.journeyLine, i <= currentStep && styles.journeyLineDone)} />
                  <span className={cn(styles.journeyDot, done && styles.journeyDotDone, current && styles.journeyDotCurrent)}>
                    {done ? <Check size={12} /> : i + 1}
                  </span>
                  <p className={cn(styles.journeyLabel, i <= currentStep && styles.journeyLabelActive)}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  Qty {item.quantity} · <span className={styles.itemPrice}>{formatNaira((item.price * item.quantity))}</span>
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
            <Truck size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} /> Activity
          </p>
          {tracking.timeline.map((cp, i) => (
            <div key={i} className={styles.item} style={{ alignItems: 'baseline' }}>
              <span style={{ flex: 1, fontSize: '0.85rem' }}>{str(cp, 'status') ?? tracking.status}</span>
              <span className={styles.noteText}>{str(cp, 'occurred_at') ? new Date(str(cp, 'occurred_at')!).toLocaleDateString() : ''}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Summary</p>
        <div className={styles.totalsRow}>
          <span>Subtotal</span>
          <span>{formatNaira(order.subtotal)}</span>
        </div>
        {!!order.shipping_fee && (
          <div className={styles.totalsRow}>
            <span>Shipping</span>
            <span>{formatNaira(order.shipping_fee)}</span>
          </div>
        )}
        {!!order.discount && (
          <div className={styles.totalsRow}>
            <span>Discount</span>
            <span>-{formatNaira(order.discount)}</span>
          </div>
        )}
        <div className={styles.tearLine} />
        <div className={styles.totalsGrand}>
          <span>Total</span>
          <span>{formatNaira(order.total)}</span>
        </div>
      </div>

      {CANCELLABLE.has(order.status) && <CancelButton orderId={order.id} />}
    </div>
  );
}
