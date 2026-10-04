import Link from 'next/link';
import { Clock, Store, CheckCircle2 } from 'lucide-react';
import { requireSession } from '@/lib/api/session';
import { listCategoryTree } from '@/lib/api/categories';
import { safeFetch } from '@/lib/api/safe';
import { ApplicationForm } from './application-form';
import styles from './page.module.css';

export const metadata = { title: 'Become a seller · Markt' };

export default async function BecomeSellerPage() {
  const user = await requireSession('/app/become-seller');
  const status = user.seller_account?.verification_status;

  // Already a live, verified seller — nothing to apply for.
  if (user.is_seller && status === 'verified') {
    return (
      <StatusShell
        icon={<CheckCircle2 size={34} />}
        tone="ok"
        title="You’re a verified seller"
        body="Your shop is live. Head to your dashboard to manage products and orders."
        cta={{ href: '/app/dashboard', label: 'Go to dashboard' }}
      />
    );
  }

  // Applied already and awaiting review (interim: create-seller marks the shop
  // unverified/pending until an admin approves it).
  if (user.is_seller && status !== 'rejected') {
    return (
      <StatusShell
        icon={<Clock size={34} />}
        tone="pending"
        title="Your store request is in review"
        body="Thanks — we’ve received your application and our team is reviewing your documents. You’ll get a notification and an email as soon as it’s approved."
        cta={{ href: '/app/dashboard', label: 'Back to dashboard' }}
      />
    );
  }

  const categories = (await safeFetch(() => listCategoryTree(), [])).map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.badge}>
          <Store size={16} />
        </span>
        <h1 className={styles.title}>Become a seller</h1>
        <p className={styles.lede}>
          Tell us about your shop and verify who you are. We review every application to keep Markt safe — you’ll get a
          notification and an email once your store is approved.
          {status === 'rejected' && ' Your previous application needs changes — please resubmit with clearer documents.'}
        </p>
      </header>

      <ApplicationForm categories={categories} />
    </div>
  );
}

function StatusShell({
  icon,
  tone,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  tone: 'ok' | 'pending';
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className={styles.page}>
      <div className={styles.statusCard}>
        <span className={tone === 'ok' ? styles.statusIconOk : styles.statusIconPending}>{icon}</span>
        <h1 className={styles.statusTitle}>{title}</h1>
        <p className={styles.statusBody}>{body}</p>
        <Link href={cta.href} className={styles.primaryBtn}>
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
