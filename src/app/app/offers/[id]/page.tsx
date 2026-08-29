import Link from 'next/link';
import { Info } from 'lucide-react';
import styles from './page.module.css';

export default function OfferDetailPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/offers">Offers</Link> / detail
      </nav>

      <div className={styles.card} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          The real API has no endpoint to fetch a single offer by ID — offers are only readable as part of their
          request. Open the request this offer was made on instead: <Link href="/app/requests">Browse requests</Link>.
        </span>
      </div>
    </div>
  );
}
