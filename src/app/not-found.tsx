import Link from 'next/link';
import styles from './not-found.module.css';

const LINKS = [
  { href: '/app/orders', label: 'Your Orders' },
  { href: '/app/marketplace', label: 'Marketplace' },
  { href: '/app/community/social-feed', label: 'Community' },
  { href: '/app/dashboard', label: 'Dashboard' },
];

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        <h1>Page Not Found</h1>
        <p>
          The page you&apos;re looking for doesn&apos;t exist or has moved. If you just made a payment, don&apos;t worry —
          your order is safe. You can find it under <strong>Your Orders</strong>.
        </p>

        <div className={styles.actions}>
          <Link href="/app/dashboard" className={styles.primaryBtn}>
            Go to Dashboard
          </Link>
          <Link href="/app/orders" className={styles.secondaryBtn}>
            View Your Orders
          </Link>
        </div>

        <div className={styles.helpfulLinks}>
          <h3>Popular pages</h3>
          <div className={styles.linksGrid}>
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.helpfulLink}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
