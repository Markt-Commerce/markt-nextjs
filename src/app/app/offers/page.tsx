import Link from 'next/link';
import { Info } from 'lucide-react';
import styles from './page.module.css';

export default function MyOffersPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Offers
      </h1>

      <div className={styles.emptyState} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', textAlign: 'left' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          The real API has no endpoint to list every offer you&apos;ve made across requests — offers are only readable
          per-request. <Link href="/app/requests">Browse buy requests</Link> to see and manage the offers you&apos;ve sent on
          each one.
        </span>
      </div>
    </div>
  );
}
