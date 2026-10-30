import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getMyBusiness } from '@/lib/api/business';
import { safeFetch } from '@/lib/api/safe';
import { ProcurementForm } from './procurement-form';
import styles from '../../business.module.css';

export default async function NewProcurementPage() {
  const user = await requireSession('/app/business/procurement/new');
  const cookie = await getForwardedCookie();
  const [config, mine] = await Promise.all([getBusinessConfig(), safeFetch(() => getMyBusiness(cookie), null)]);
  if (!mine?.profile || !mine.business_tag) redirect('/app/business/onboarding');
  if (!config.features.procurement_enabled) redirect('/app/business/procurement');

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/business/procurement">Procurement</Link> / New request
      </nav>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>New procurement request</p>
          <h1 className={styles.title}>What does your business need?</h1>
          <p className={styles.sub}>
            Suppliers see this and respond with offers. Nothing becomes an order until you accept an offer and agree the
            terms.
          </p>
        </div>
      </header>

      {!user.is_buyer ? (
        <div className={styles.empty}>
          <p>Posting procurement requests needs a buyer account. Add one in Settings — it uses the same login.</p>
          <Link href="/app/settings" className={styles.btnPrimary}>
            Go to Settings
          </Link>
        </div>
      ) : (
        <ProcurementForm units={config.units} defaultLocation={[mine.profile.city, mine.profile.state].filter(Boolean).join(', ')} />
      )}
    </div>
  );
}
