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
import { RecoverPaymentId } from './recover-payment-id';
import styles from './page.module.css';

/**
 * Collapse whatever status string the verify endpoint hands back (Paystack's
 * transaction status, or the backend's own payment status — the endpoint is
 * undocumented, so we accept both vocabularies and dig one level into `data`)
 * into our three outcomes. Anything unrecognised stays `pending` so we keep
 * polling rather than wrongly declaring success or failure.
 */
function readVerifyOutcome(v: Record<string, unknown> | null): 'paid' | 'failed' | 'pending' | null {
  if (!v) return null;
  const data = (v.data ?? null) as Record<string, unknown> | null;
  const raw = v.status ?? v.payment_status ?? data?.status ?? data?.payment_status;
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  if (['success', 'successful', 'completed', 'paid'].includes(s)) return 'paid';
  if (['failed', 'abandoned', 'cancelled', 'canceled', 'reversed', 'declined', 'refunded'].includes(s))
    return 'failed';
  return 'pending';
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  // Paystack (or the backend callback) may return with any of these — treat any
  // of them as "the buyer is coming back from the payment page".
  searchParams: Promise<{
    paid?: string;
    reference?: string;
    trxref?: string;
    status?: string;
    // Our own payment id, threaded back across the round-trip (see
    // RecoverPaymentId) so we can verify this payment without the list lookup.
    payment_id?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  // Any of these means "the buyer is coming back from the payment page". We test
  // `paid` loosely (presence, not `=== '1'`) because a gateway/callback that
  // appends its params with a stray `?` instead of `&` can leave it as
  // `paid=1?reference=…` — we still want to treat that as a return, and the
  // gateway-verify step below settles the real outcome regardless.
  const returningFromPayment = sp.paid != null || !!sp.reference || !!sp.trxref || sp.status === 'failed';
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

  // Prefer the payment id threaded back from initialize: a single
  // `GET /payments/{id}` is both exact and avoids the payments-list lookup,
  // which has been observed to 500. Fall back to matching by order in the list
  // only when we weren't handed an id (e.g. storage disabled, cold deep-link).
  let payment: Payment | null = sp.payment_id
    ? await getPayment(sp.payment_id, cookie).catch(() => null)
    : null;
  if (!payment) payment = await findPaymentForOrder(id, cookie);

  // Coming back from Paystack but the order still reads unpaid: don't just wait
  // on the webhook — actively verify with the gateway, then re-read the
  // canonical state. This turns an optimistic "confirming" into a real answer.
  // We also keep the gateway's *own* verdict: Paystack's /verify is synchronous
  // and authoritative, so when a buyer cancels/abandons the charge it tells us
  // "failed/abandoned" immediately — without it the page would sit on
  // "confirming…" forever waiting for a DB write that never comes.
  let verifyOutcome: 'paid' | 'failed' | 'pending' | null = null;
  if (returningFromPayment && payment && order.status === 'pending_payment' && payment.status !== 'completed') {
    const v = await verifyPayment(payment.id, cookie).catch(() => null);
    verifyOutcome = readVerifyOutcome(v);
    const [freshOrder, freshPayment] = await Promise.all([
      getOrder(id, cookie).catch(() => order),
      getPayment(payment.id, cookie).catch(() => payment),
    ]);
    order = freshOrder;
    payment = freshPayment;
  }

  // Truth from independent signals: the order left pending_payment, the payment
  // record is completed, or the gateway's verify said success. Any one is enough.
  const paidOk =
    order.status !== 'pending_payment' || payment?.status === 'completed' || verifyOutcome === 'paid';
  const failed =
    !paidOk &&
    (payment?.status === 'failed' ||
      payment?.status === 'refunded' ||
      sp.status === 'failed' ||
      verifyOutcome === 'failed');
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
      {/* On return without an id in the URL, pull the one we stashed at
          initialize into the query so we can verify by id (no list lookup). */}
      {returningFromPayment && !sp.payment_id && <RecoverPaymentId orderId={id} hasPaymentId={false} />}
      {confirming && <AutoRefresh />}

      <div className={iconClass}>{icon}</div>
      <h1 className={styles.title}>{heading}</h1>
      <p className={styles.orderId}>
        Order <strong>#{order.order_number ?? order.id}</strong> — total {formatNaira(order.total)}.
      </p>

      {confirming && (
        <p className={styles.note}>
          We&apos;re checking with the payment provider — this usually takes only a few seconds and updates on its own.{' '}
          <Link href={`/app/checkout/confirmation/${order.id}?paid=1${sp.payment_id ? `&payment_id=${encodeURIComponent(sp.payment_id)}` : ''}`}>
            Refresh now
          </Link>
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
