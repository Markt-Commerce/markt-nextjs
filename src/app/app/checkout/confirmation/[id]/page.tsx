import Link from 'next/link';
import { CheckCircle2, Clock } from 'lucide-react';
import { getForwardedCookie } from '@/lib/api/session';
import { getOrder } from '@/lib/api/orders';
import { PayNowButton } from './pay-now-button';
import styles from './page.module.css';

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let order;
  try {
    order = await getOrder(id, await getForwardedCookie());
  } catch {
    return (
      <div className={styles.page}>
        <p>We couldn&apos;t load your order confirmation right now.</p>
        <div className={styles.actions}>
          <Link href={`/app/orders/${id}`} className={styles.primaryBtn}>
            View Order
          </Link>
        </div>
      </div>
    );
  }

  const needsPayment = order.status === 'pending_payment';

  return (
    <div className={styles.page}>
      <div className={styles.iconWrap}>{needsPayment ? <Clock size={32} /> : <CheckCircle2 size={32} />}</div>
      <h1 className={styles.title}>{needsPayment ? 'Order placed — payment needed' : 'Order placed!'}</h1>
      <p className={styles.orderId}>
        Order <strong>#{order.order_number ?? order.id}</strong> — total ${order.total.toFixed(2)}.
      </p>

      {needsPayment && <PayNowButton orderId={order.id} />}

      <div className={styles.actions}>
        <Link href="/app/marketplace" className={styles.primaryBtn}>
          Continue Shopping
        </Link>
        <Link href={`/app/orders/${order.id}`} className={styles.secondaryBtn}>
          View Order
        </Link>
      </div>
    </div>
  );
}
