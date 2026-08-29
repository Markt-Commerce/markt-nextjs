import Link from 'next/link';
import { Info } from 'lucide-react';
import styles from './page.module.css';

export default function MyReviewsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Reviews
      </h1>

      <div className={styles.formCard}>
        <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            The real API has no endpoint to list every review you&apos;ve written across products — reviews are only
            readable per-product. You can still write and read reviews right on each product&apos;s page.{' '}
            <Link href="/app/marketplace">Browse the marketplace</Link> to find something you&apos;ve bought and leave a
            review.
          </span>
        </p>
      </div>
    </div>
  );
}
