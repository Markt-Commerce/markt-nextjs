import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import styles from './not-found.module.css';

const LINKS = [
  { href: '/app/marketplace', label: 'Marketplace' },
  { href: '/app/community', label: 'Community' },
  { href: '/auth/login', label: 'Sign In' },
  { href: '/auth/register', label: 'Create Account' },
];

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>
        <h1>Page Not Found</h1>
        <p>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>

        <div className={styles.actions}>
          <Link href="/">
            <Button variant="primary" size="lg">Go Home</Button>
          </Link>
          <Link href="/app/marketplace">
            <Button variant="secondary" size="lg">Browse Marketplace</Button>
          </Link>
        </div>

        <div className={styles.helpfulLinks}>
          <h3>Popular Pages</h3>
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
