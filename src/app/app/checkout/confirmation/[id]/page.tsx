import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import { CheckCircle2, Clock } from 'lucide-react';
import { getForwardedCookie } from '@/lib/api/session';
import { getOrder } from '@/lib/api/orders';
import { PayNowButton } from './pay-now-button';
import styles from './page.module.css';

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const returningFromPayment = paid === '1';

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
  // Just came back from Paystack but the order still reads unpaid — the
  // confirmation webhook can lag a few seconds, so don't re-prompt to pay.
  const confirming = returningFromPayment && needsPayment;
  const paidOk = !needsPayment;

  const heading = confirming
    ? 'Payment received — confirming your order'
    : paidOk
      ? 'Order confirmed!'
      : 'Order placed — payment needed';

  return (
    <div className={styles.page}>
      <div className={styles.iconWrap}>{paidOk ? <CheckCircle2 size={32} /> : <Clock size={32} />}</div>
      <h1 className={styles.title}>{heading}</h1>
      <p className={styles.orderId}>
        Order <strong>#{order.order_number ?? order.id}</strong> — total {formatNaira(order.total)}.
      </p>

      {confirming && (
        <p className={styles.note}>
          This usually only takes a moment.{' '}
          <Link href={`/app/checkout/confirmation/${order.id}?paid=1`}>Refresh status</Link>
        </p>
      )}

      {/* Only offer "Pay Now" when they haven't started payment yet. */}
      {needsPayment && !returningFromPayment && <PayNowButton orderId={order.id} />}

      <div className={styles.actions}>
        <Link href={`/app/orders/${order.id}`} className={styles.primaryBtn}>
          View Order
        </Link>
        <Link href="/app/marketplace" className={styles.secondaryBtn}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
