import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getForwardedCookie } from '@/lib/api/session';
import { getOrder } from '@/lib/api/orders';
import { findPaymentForOrder, getPayment, verifyPayment } from '@/lib/api/payments';
import type { Payment } from '@/lib/types/payment';
import type { Order } from '@/lib/types/order';
import { PayNowButton } from './pay-now-button';
import { AutoRefresh } from './auto-refresh';
import styles from './page.module.css';

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  // Paystack (or the backend callback) may return with any of these — treat any
  // of them as "the buyer is coming back from the payment page".
  searchParams: Promise<{ paid?: string; reference?: string; trxref?: string; status?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const returningFromPayment = sp.paid === '1' || !!sp.reference || !!sp.trxref;
  const cookie = await getForwardedCookie();

  let order: Order;
  try {
    order = await getOrder(id, cookie);
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

  let payment: Payment | null = await findPaymentForOrder(id, cookie);

  // Coming back from Paystack but the order still reads unpaid: don't just wait
  // on the webhook — actively verify with the gateway, then re-read the
  // canonical state. This turns an optimistic "confirming" into a real answer.
  if (returningFromPayment && payment && order.status === 'pending_payment' && payment.status !== 'completed') {
    await verifyPayment(payment.id, cookie).catch(() => {});
    const [freshOrder, freshPayment] = await Promise.all([
      getOrder(id, cookie).catch(() => order),
      getPayment(payment.id, cookie).catch(() => payment),
    ]);
    order = freshOrder;
    payment = freshPayment;
  }

  // Truth from two independent signals: the order left pending_payment, or the
  // payment record is completed. Either is enough to call it paid.
  const paidOk = order.status !== 'pending_payment' || payment?.status === 'completed';
  const failed = !paidOk && (payment?.status === 'failed' || payment?.status === 'refunded' || sp.status === 'failed');
  // Came back, gateway hasn't confirmed yet, but it hasn't failed either.
  const confirming = !paidOk && !failed && returningFromPayment;
  // Never started (or abandoned before paying).
  const needsPayment = !paidOk && !failed && !confirming;

  const heading = paidOk
    ? 'Order confirmed!'
    : failed
      ? 'Payment didn’t go through'
      : confirming
        ? 'Confirming your payment…'
        : 'Order placed — payment needed';

  const icon = paidOk ? <CheckCircle2 size={32} /> : failed ? <XCircle size={32} /> : <Clock size={32} />;
  const iconClass = cn(styles.iconWrap, confirming && styles.iconWrapPending, failed && styles.iconWrapError);

  return (
    <div className={styles.page}>
      {confirming && <AutoRefresh />}

      <div className={iconClass}>{icon}</div>
      <h1 className={styles.title}>{heading}</h1>
      <p className={styles.orderId}>
        Order <strong>#{order.order_number ?? order.id}</strong> — total {formatNaira(order.total)}.
      </p>

      {confirming && (
        <p className={styles.note}>
          We&apos;re checking with the payment provider — this usually takes only a few seconds and updates on its own.{' '}
          <Link href={`/app/checkout/confirmation/${order.id}?paid=1`}>Refresh now</Link>
        </p>
      )}

      {failed && (
        <p className={cn(styles.note, styles.noteError)}>
          No charge was completed. You can try paying again, or head to your order and pay later.
        </p>
      )}

      {/* Offer payment when it's genuinely needed, or to retry after a failure. */}
      {(needsPayment || failed) && <PayNowButton orderId={order.id} />}

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
