import Link from 'next/link';
import { ShieldCheck, MapPin, UserCog, ChevronRight } from 'lucide-react';
import { requireSession } from '@/lib/api/session';
import { AddressForm } from './address-form';
import { RolePanel } from './role-panel';
import { DangerZone } from './danger-zone';
import styles from './page.module.css';

export default async function SettingsPage() {
  const user = await requireSession();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings
      </h1>
      <p className={styles.subtitle}>Manage your account, address, and privacy.</p>

      <Link href="/app/settings/privacy" className={`${styles.section} ${styles.sectionLink}`}>
        <div className={styles.linkCard}>
          <div>
            <p className={styles.sectionTitle}>
              <ShieldCheck size={16} />
              Privacy
            </p>
            <p className={styles.sectionDesc} style={{ marginBottom: 0 }}>Control who can see your profile and how people can reach you.</p>
          </div>
          <ChevronRight size={18} className={styles.linkChevron} />
        </div>
      </Link>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>
          <MapPin size={16} />
          Shipping / pickup address
        </p>
        <p className={styles.sectionDesc}>Used for delivery, or for seller pickup logistics if you sell.</p>
        <AddressForm address={user.address} />
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>
          <UserCog size={16} />
          Account type
        </p>
        <p className={styles.sectionDesc}>Markt supports both buying and selling from one account.</p>
        <RolePanel user={user} />
      </div>

      <DangerZone username={user.username} />
    </div>
  );
}
