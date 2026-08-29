import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getForwardedCookie } from '@/lib/api/session';
import { listPayments } from '@/lib/api/payments';
import { safeFetch } from '@/lib/api/safe';
import { formattedAmount } from '@/lib/types/payment';

const EMPTY_PAYMENTS = { payments: [], page: 1, per_page: 20, pages: 0, total: 0 };
import styles from './page.module.css';

const STATUS_CLASS: Record<string, string> = {
  completed: 'statusCompleted',
  pending: 'statusPending',
  processing: 'statusProcessing',
  failed: 'statusFailed',
  refunded: 'statusRefunded',
  partially_refunded: 'statusPartially_refunded',
};

const METHOD_LABEL: Record<string, string> = {
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
  wallet: 'Markt Wallet',
};

export default async function PaymentsPage() {
  const cookie = await getForwardedCookie();
  const data = await safeFetch(() => listPayments(cookie), EMPTY_PAYMENTS);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Payment History</h1>

      {data.payments.length === 0 && <div className={styles.emptyState}>No payments yet. They&apos;ll show up here after you check out.</div>}

      {data.payments.length > 0 && (
        <div className={styles.list}>
          {data.payments.map((payment) => (
            <Link key={payment.id} href={`/app/orders/${payment.order_id}`} className={styles.row}>
              <div className={styles.iconWrap}>
                <CreditCard size={18} />
              </div>
              <div className={styles.rowBody}>
                <p className={styles.rowTitle}>{METHOD_LABEL[payment.method] ?? payment.method}</p>
                <p className={styles.rowMeta}>
                  {new Date(payment.created_at).toLocaleDateString()} · Order #{payment.order_id}
                </p>
              </div>
              <span className={styles.amount}>{formattedAmount(payment)}</span>
              <span className={cn(styles.statusBadge, styles[STATUS_CLASS[payment.status]])}>{payment.status.replace('_', ' ')}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
