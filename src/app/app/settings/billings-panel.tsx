import { Wallet } from 'lucide-react';
import { getWalletBalance, getWalletTransactions } from '@/lib/api/wallet';
import { safeFetch } from '@/lib/api/safe';
import styles from './page.module.css';

/**
 * Billing tab — the Markt equivalent of the reference's "Billings": the user's
 * wallet balance and their money movements (top-ups, payouts, purchases). Read
 * from the live wallet endpoints; falls back to an empty state if unavailable.
 */
export async function BillingsPanel({ cookie }: { cookie?: string }) {
  const [balance, txns] = await Promise.all([
    safeFetch(() => getWalletBalance(cookie), { available_balance: 0, currency: 'NGN' }),
    safeFetch(() => getWalletTransactions(cookie, { perPage: 12 }), { transactions: [], pagination: {} }),
  ]);

  const money = (n: number) => `${balance.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <section className={styles.sectionRow}>
        <div className={styles.sectionAside}>
          <h2 className={styles.sectionHeading}>Wallet</h2>
          <p className={styles.sectionLede}>Your Markt balance, used for purchases, top-ups, and seller payouts.</p>
        </div>
        <div className={styles.sectionFields}>
          <div className={styles.balanceCard}>
            <span className={styles.balanceIcon}><Wallet size={18} /></span>
            <div>
              <p className={styles.balanceLabel}>Available balance</p>
              <p className={styles.balanceValue}>{money(balance.available_balance)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.billingHistory}>
        <h3 className={styles.billingSubhead}>Billing history</h3>
        <p className={styles.sectionLede}>Top-ups, purchases, and payouts on your account.</p>

        {txns.transactions.length === 0 ? (
          <p className={styles.emptyText}>No transactions yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className={styles.numCol}>Amount</th>
                  <th className={styles.numCol}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {txns.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className={styles.dateCell}>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td>{t.description || t.reference_type || '—'}</td>
                    <td>
                      <span className={styles.txnType}>{t.type}</span>
                    </td>
                    <td className={styles.numCol}>{money(t.amount)}</td>
                    <td className={styles.numCol}>{money(t.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
